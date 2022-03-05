
export interface IActionData {
  __flows?: {
    flowName?: string;
    jump?: string;
    error?: Error;
    done?: boolean;
    requestId?: string;
  }
}

interface IPreFlowHookData<T> extends IHookData {
  input: T;
}

interface IPostFlowHookData<S> extends IHookData {
  output: S;
}

interface IPreActionHookData<T, S> extends IHookData {
  input: T;
  i: number;
  actionFn: (data: T, unsafe: object) => S | PromiseLike<S>;
}

interface IPostActionHookData<T, S> extends IHookData {
  input: T;
  output: S;
  i: number;
  actionFn: (data: T, unsafe: object) => S | PromiseLike<S>
}

interface IExceptionHookData<T, S> extends IHookData {
  input: T;
  i: number;
  actionFn: (data: T, unsafe: object) => S | PromiseLike<S>;
  error: Error;
}

interface IHookData {
  flowName: string;
}

interface IMeta {
  activated: string[];
  requestId: string;
}

type Hook<T extends IHookData> = (hookData: T) => void;
type Action = <T extends IActionData, U>(data: T, unsafe: U) => unknown | PromiseLike<unknown>;
type Flow = Action[];

export enum SupportedHooks {
  pre_action = 'pre_action',
  post_action = 'post_action',
  pre_flow = 'pre_flow',
  post_flow = 'post_flow',
  exception = 'exception'
}

export class Flows {
  private hooks: Map<SupportedHooks, Hook<IHookData>[]> = new Map([
    [SupportedHooks.pre_action, []],
    [SupportedHooks.post_action, []],
    [SupportedHooks.pre_flow, []],
    [SupportedHooks.post_flow, []],
    [SupportedHooks.exception, []]
  ]);
  private flows: Map<string, Flow> = new Map();

  constructor() {
    this.executeRepeat = this.executeRepeat.bind(this);
  }

  private getHook<T extends IHookData>(hookName: SupportedHooks):Hook<T>[] {
    const hook: Hook<T>[] | undefined = this.hooks.get(hookName);
    
    if(!Array.isArray(hook)) {
      throw new Error(`Hook ${hookName} is not a known hook, please read the docs regarding acceptable hooks`);
    }

    return hook;
  }

  private getAction<T extends IActionData, S extends IActionData, U>(flowName: string, i: number): (data: T, unsafe: U) => S | PromiseLike<S> {
    const flow = this.flows.get(flowName);
    
    if(!Array.isArray(flow) || !flow[i]) {
      throw new Error('flow does not exists!');
    }

    return flow[i] as unknown as (data: T, unsafe: {}) => S | PromiseLike<S>; 
  }

  /**
   * register flow
   * @param {string} name the name of the flow
   * @param {function[]} actions an array of functions
   */
  register(name: string, flow: Flow): void {
    this.flows.set(name, flow);
  }

  /**
   *  add hook
   * @param {SupportedHooks} name the name of the hook
   * @param {Hook} fn the function to execute
   */
  hook(name: SupportedHooks, fn: Hook<IHookData>): void {
    const hook = this.getHook(name);

    hook.push(fn);
  }


  private isActionExists(flowName: string, i: number): boolean {
    const flow = this.flows.get(flowName);
    
    return Array.isArray(flow) 
      && (({}).toString.call(flow[i]) === '[object Function]' || ({}).toString.call(flow[i]) === '[object AsyncFunction]');
  }

  /**
   * this method run recursively the flow in order to allow async based function and jump between flows.
   *  
   * @param flowName the name of the flow
   * @param data the data pass to the flow
   * @param i the index number of the action in the flow
   */
  private async executeRepeat<T extends IActionData, S extends IActionData, U>(flowName: string, data: T, unsafe: U, i: number, meta: IMeta = {activated: [], requestId: ''}): Promise<S> {
    const action = this.isActionExists(flowName, i) ? this.getAction(flowName, i) : null;
    const actionData: T = JSON.parse(JSON.stringify(data));
    let nextActionData: S = {__flows: actionData.__flows} as S;
    let lastFlow = meta.activated.length > 0 ? meta.activated[meta.activated.length - 1] : null;
    
    if(actionData.__flows && actionData.__flows.requestId) {
      meta.requestId = actionData.__flows.requestId;
    }

    if(flowName !== lastFlow && meta.activated.indexOf(flowName) === -1) {
      meta.activated.push(flowName);
    } else if(flowName !== lastFlow) {
      throw new Error(`cyclic flow!!, [${meta.activated.join(', ')}, ${flowName}]`);
    }

    /** post_flow hook */
    if(!action || (actionData.__flows && actionData.__flows.done)) {
      if(!actionData.__flows) actionData.__flows = {};
      
      actionData.__flows.requestId = meta.requestId;
      this.getHook<IPostFlowHookData<T>>(SupportedHooks.post_flow).forEach(fn => fn({flowName, output: actionData}));

      return JSON.parse(JSON.stringify(actionData));
    }

    /** pre_action hook */
    this.getHook<IPreActionHookData<T, S>>(SupportedHooks.pre_action).forEach(fn => fn({flowName, i, actionFn: this.getAction(flowName, i), input: actionData}));

    try {
      /** execution */
      const result = await this.getAction(flowName, i)(actionData, unsafe);

      if(typeof result !== 'object') {
        throw new Error(`in flow ${flowName} action number ${i} return "${result}" instead of object!\nactions must return object`);
      }
      
      Object.assign(nextActionData, result);

      /** exception hook */
    } catch(error) {     
      this.getHook<IExceptionHookData<T, S>>(SupportedHooks.exception).forEach(fn => fn({flowName, i, actionFn: this.getAction(flowName, i), input: actionData, error: error as Error}));
      
      throw error;
    }

    /** post_action hook */
    this.getHook<IPostActionHookData<T, S>>(SupportedHooks.post_action).forEach(fn => fn({flowName, i, actionFn: this.getAction(flowName, i), input: actionData, output: nextActionData}));

    /** next action */
    if(nextActionData.__flows && nextActionData.__flows.jump ) {
      const jumpTo = nextActionData.__flows.jump;
      delete nextActionData.__flows.jump;
      return await this.executeRepeat(jumpTo, nextActionData, unsafe, 0, meta);
    }
    
    return await this.executeRepeat(flowName, nextActionData, unsafe, i + 1, meta);
  }

  /**
   * start the execution process on a registered flow.
   * @param {string} flowName 
   * @param {object} input 
   */
  execute<T, S, U>(flowName: string, input: T, unsafe?: U): S | PromiseLike<S>  {
    // We make sure that data is serializable
    const data: T = JSON.parse(JSON.stringify(input));

    if(!this.flows.has(flowName)) {
      console.warn(`${flowName} flow does not exists! Skipped`);
      return JSON.parse(JSON.stringify(input));
    }

    /** pre_flow hook */
    this.getHook<IPreFlowHookData<T>>(SupportedHooks.pre_flow).forEach(fn => fn({flowName: flowName, input: data}));

    return this.executeRepeat<T, S, unknown>(flowName, data, unsafe || {}, 0);    
  }
}
