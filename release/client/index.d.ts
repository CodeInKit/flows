export interface ActionData {
    __flows?: {
        jump?: string;
        error?: Error;
        done?: boolean;
    };
}
interface HookData {
    flowName: string;
    input?: ActionData;
    output?: ActionData;
    i?: number;
    actionFn?: action;
    error?: Error;
}
declare type action = (data: ActionData, unsafe?: object) => ActionData | Promise<ActionData> | void;
declare type hook = (hookData: HookData) => void;
declare type supportedHooks = 'pre_action' | 'post_action' | 'pre_flow' | 'post_flow' | 'exception';
export declare class Flows {
    private hooks;
    private flows;
    constructor();
    /**
     * register flow
     * @param {string} name the name of the flow
     * @param {function[]} actions an array of functions
     */
    register(name: string, actions: action[]): void;
    /**
     *  add hook
     * @param {supportedHooks} name the name of the hook
     * @param {hook} fn the function to execute
     */
    hook(name: supportedHooks, fn: hook): void;
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
    execute(flowName: string, input: ActionData, unsafe?: any): Promise<ActionData>;
}
export {};
