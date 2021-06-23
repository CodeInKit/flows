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
}
declare type Hook<T extends IHookData> = (hookData: T) => void;
declare type Action = <T extends IActionData, U>(data: T, unsafe: U) => unknown | PromiseLike<unknown>;
declare type Flow = Action[];
export declare enum SupportedHooks {
    pre_action = "pre_action",
    post_action = "post_action",
    pre_flow = "pre_flow",
    post_flow = "post_flow",
    exception = "exception"
}
export declare class Flows {
    private hooks;
    private flows;
    constructor();
    private getHook;
    private getAction;
    /**
     * register flow
     * @param {string} name the name of the flow
     * @param {function[]} actions an array of functions
     */
    register(name: string, flow: Flow): void;
    /**
     *  add hook
     * @param {SupportedHooks} name the name of the hook
     * @param {Hook} fn the function to execute
     */
    hook(name: SupportedHooks, fn: Hook<IHookData>): void;
    private isActionExists;
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
    execute<T, S, U>(flowName: string, input: T, unsafe?: U): S | PromiseLike<S>;
}
export {};
