
export interface IActionData {
  __flows?: {
    flowName?: string;
    jump?: string;
    error?: Error;
    done?: boolean;
    requestId?: string;
  }
}

interface IHookData {
  flowName: string;
  input?: IActionData;
  output?: IActionData;
  i?: number;
  actionFn?: Action<IActionData>;
  error?: Error;
}

interface IMeta {
  activated: string[];
  requestId: string;
}

type Action<T extends IActionData> = (data: IActionData, unsafe?: object) => T;
type Hook = (hookData: IHookData) => void;
type SupportedHooks = 'pre_action' | 'post_action' | 'pre_flow' | 'post_flow' | 'exception';

export class Flows {
  private hooks: Map<SupportedHooks, Hook[]> = new Map([
    ['pre_action', []],
    ['post_action', []],
    ['pre_flow', []],
    ['post_flow', []],
    ['exception', []]
  ]);
  private flows: Map<string, Action<IActionData>[]> = new Map();

  constructor() {
    this.executeRepeat = this.executeRepeat.bind(this);
  }

  /**
   * register flow
   * @param {string} name the name of the flow
   * @param {function[]} actions an array of functions
   */
  register<T>(name: string, actions: Action<T>[]) {
    this.flows.set(name, actions);
  }

  /**
   *  add hook
   * @param {SupportedHooks} name the name of the hook
   * @param {Hook} fn the function to execute
   */
  hook(name: SupportedHooks, fn: Hook) {
    if(!this.hooks.has(name)) {
      throw new Error(`Hook ${name} is not a known hook, please read the docs regarding acceptable hooks`)
    }

    this.hooks.get(name).push(fn);
  }


  /**
   * this method run recursively the flow in order to allow async based function and jump between flows.
   *  
   * @param flowName the name of the flow
   * @param data the data pass to the flow
   * @param i the index number of the action in the flow
   */
  private async executeRepeat<T extends IActionData>(flowName: string, data: T, unsafe: object, i: number, meta: Partial<IMeta> = {}): Promise<T> {
    const flow = this.flows.get(flowName);
    const action: Action<T> = flow && flow[i] as Action<T>;
    const actionData: T = JSON.parse(JSON.stringify(data));
    let nextActionData: T = {__flows: actionData.__flows} as T;
    let lastFlow = meta.activated ? meta.activated[meta.activated.length - 1] : null;
    
    if(actionData.__flows && actionData.__flows.requestId) {
      meta.requestId = actionData.__flows.requestId;
    }

    if(!lastFlow) {
      meta.activated = [flowName];
    } else if(flowName !== lastFlow && meta.activated.indexOf(flowName) === -1) {
      meta.activated.push(flowName);
    } else if(flowName !== lastFlow) {
      throw new Error(`cyclic flow!!, [${meta.activated.join(', ')}, ${flowName}]`);
    }

    /** post_flow hook */
    if(!flow || !action || (actionData.__flows && actionData.__flows.done)) {
      if(!actionData.__flows) actionData.__flows = {};
      
      actionData.__flows.requestId = meta.requestId;
      this.hooks.get('post_flow').forEach(fn => fn({flowName, output: actionData}));
      return actionData;
    }

    /** pre_action hook */
    this.hooks.get('pre_action').forEach(fn => fn({flowName, i, actionFn: this.flows.get(flowName)[i], input: actionData}));

    try {
      /** execution */
      const result = await this.flows.get(flowName)[i](actionData, unsafe);

      if(typeof result !== 'object') {
        throw new Error(`in flow ${flowName} action number ${i} return "${result}" instead of object!\nactions must return object`);
      }
      
      Object.assign(nextActionData, result);

      /** exception hook */
    } catch(error) {     
      this.hooks.get('exception').forEach(fn => fn({flowName, i, actionFn: this.flows.get(flowName)[i], input: actionData, error}));
      
      throw error;
    }

    /** post_action hook */
    this.hooks.get('post_action').forEach(fn => fn({flowName, i, actionFn: this.flows.get(flowName)[i], input: actionData, output: nextActionData}));

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
  execute<T extends IActionData>(flowName: string, input: T, unsafe?: object): Promise<T>  {
    const data: T = JSON.parse(JSON.stringify(input));

    if(!this.flows.has(flowName)) {
      console.warn(`${flowName} flow does not exists! Skipped`);
      return Promise.resolve(input);
    }

    /** pre_flow hook */
    this.hooks.get('pre_flow').forEach(fn => fn({flowName: flowName, input: data}));

    return this.executeRepeat<T>(flowName, data, unsafe || {}, 0);    
  }
}
