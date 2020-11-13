export interface IActionData {
    __flows?: {
        flowName?: string;
        jump?: string;
        error?: Error;
        done?: boolean;
        requestId?: string;
    };
}
interface IHookData {
    flowName: string;
    input?: IActionData;
    output?: IActionData;
    i?: number;
    actionFn?: Action<IActionData>;
    error?: Error;
}
declare type Action<T extends Partial<IActionData>> = (data: T, unsafe?: object) => Promise<any>;
declare type ActionList = {
    [index: number]: Action<Object>;
};
declare type Hook = (hookData: IHookData) => void;
declare type SupportedHooks = 'pre_action' | 'post_action' | 'pre_flow' | 'post_flow' | 'exception';
export declare class Flows {
    private hooks;
    private flows;
    constructor();
    /**
     * register flow
     * @param {string} name the name of the flow
     * @param {function[]} actions an array of functions
     */
    register(name: string, actions: ActionList): void;
    /**
     *  add hook
     * @param {SupportedHooks} name the name of the hook
     * @param {Hook} fn the function to execute
     */
    hook(name: SupportedHooks, fn: Hook): void;
    /**
     * this method run recursively the flow in order to allow async based function and jump between flows.
     *
     * @param flowName the name of the flow
     * @param data the data pass to the flow
     * @param i the index number of the action in the flow
     */
    private executeRepeat;
    /**
     * start the execution process on a registered flow.
     * @param {string} flowName
     * @param {object} input
     */
    execute<T extends IActionData, S>(flowName: string, input: T, unsafe?: object): Promise<S>;
}
export {};
