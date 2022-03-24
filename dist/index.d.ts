interface HookInput {
    [SupportedHooks.PRE_ACTION]: {};
    [SupportedHooks.POST_ACTION]: {};
    [SupportedHooks.PRE_FLOW]: {};
    [SupportedHooks.POST_FLOW]: {};
    [SupportedHooks.EXCEPTION]: {};
}
export declare enum SupportedHooks {
    PRE_ACTION = "PRE_ACTION",
    POST_ACTION = "POST_ACTION",
    PRE_FLOW = "PRE_FLOW",
    POST_FLOW = "POST_FLOW",
    EXCEPTION = "EXCEPTION"
}
export declare type Action<ValueType, ReturnType> = (previousValue: Partial<ValueType>, unsafe: unknown) => ReturnType | PromiseLike<ReturnType>;
export declare type InitialAction<ReturnType> = (...params: any) => ReturnType | PromiseLike<ReturnType>;
export declare class Flows {
    private hooks;
    private flows;
    constructor();
    private getHook;
    private getAction;
    /**
     * register flow
     */
    register<ReturnType>(name: string, flow: readonly [InitialAction<ReturnType>]): void;
    register<ValueType1, ReturnType>(name: string, flow: readonly [
        InitialAction<ValueType1>,
        Action<ValueType1, ReturnType>
    ]): void;
    register<ValueType1, ValueType2, ReturnType>(name: string, flow: readonly [
        InitialAction<ValueType1>,
        Action<ValueType1, ValueType2>,
        Action<ValueType2, ReturnType>
    ]): void;
    register<ValueType1, ValueType2, ValueType3, ReturnType>(name: string, flow: readonly [
        InitialAction<ValueType1>,
        Action<ValueType1, ValueType2>,
        Action<ValueType2, ValueType3>,
        Action<ValueType3, ReturnType>
    ]): void;
    register<ValueType1, ValueType2, ValueType3, ValueType4, ReturnType>(name: string, flow: readonly [
        InitialAction<ValueType1>,
        Action<ValueType1, ValueType2>,
        Action<ValueType2, ValueType3>,
        Action<ValueType3, ValueType4>,
        Action<ValueType4, ReturnType>
    ]): void;
    register<ValueType1, ValueType2, ValueType3, ValueType4, ValueType5, ReturnType>(name: string, flow: readonly [
        InitialAction<ValueType1>,
        Action<ValueType1, ValueType2>,
        Action<ValueType2, ValueType3>,
        Action<ValueType3, ValueType4>,
        Action<ValueType4, ValueType5>,
        Action<ValueType5, ReturnType>
    ]): void;
    register<ValueType1, ValueType2, ValueType3, ValueType4, ValueType5, ValueType6, ReturnType>(name: string, flow: readonly [
        InitialAction<ValueType1>,
        Action<ValueType1, ValueType2>,
        Action<ValueType2, ValueType3>,
        Action<ValueType3, ValueType4>,
        Action<ValueType4, ValueType5>,
        Action<ValueType5, ValueType6>,
        Action<ValueType6, ReturnType>
    ]): void;
    register<ValueType1, ValueType2, ValueType3, ValueType4, ValueType5, ValueType6, ValueType7, ReturnType>(name: string, flow: readonly [
        InitialAction<ValueType1>,
        Action<ValueType1, ValueType2>,
        Action<ValueType2, ValueType3>,
        Action<ValueType3, ValueType4>,
        Action<ValueType4, ValueType5>,
        Action<ValueType5, ValueType6>,
        Action<ValueType6, ValueType7>,
        Action<ValueType7, ReturnType>
    ]): void;
    register<ValueType1, ValueType2, ValueType3, ValueType4, ValueType5, ValueType6, ValueType7, ValueType8, ReturnType>(name: string, flow: readonly [
        InitialAction<ValueType1>,
        Action<ValueType1, ValueType2>,
        Action<ValueType2, ValueType3>,
        Action<ValueType3, ValueType4>,
        Action<ValueType4, ValueType5>,
        Action<ValueType5, ValueType6>,
        Action<ValueType6, ValueType7>,
        Action<ValueType7, ValueType8>,
        Action<ValueType8, ReturnType>
    ]): void;
    register<ValueType1, ValueType2, ValueType3, ValueType4, ValueType5, ValueType6, ValueType7, ValueType8, ValueType9, ReturnType>(name: string, flow: readonly [
        InitialAction<ValueType1>,
        Action<ValueType1, ValueType2>,
        Action<ValueType2, ValueType3>,
        Action<ValueType3, ValueType4>,
        Action<ValueType4, ValueType5>,
        Action<ValueType5, ValueType6>,
        Action<ValueType6, ValueType7>,
        Action<ValueType7, ValueType8>,
        Action<ValueType8, ValueType9>,
        Action<ValueType9, ReturnType>
    ]): void;
    register<ValueType1, ValueType2, ValueType3, ValueType4, ValueType5, ValueType6, ValueType7, ValueType8, ValueType9, ValueType10, ReturnType>(name: string, flow: readonly [
        InitialAction<ValueType1>,
        Action<ValueType1, ValueType2>,
        Action<ValueType2, ValueType3>,
        Action<ValueType3, ValueType4>,
        Action<ValueType4, ValueType5>,
        Action<ValueType5, ValueType6>,
        Action<ValueType6, ValueType7>,
        Action<ValueType7, ValueType8>,
        Action<ValueType8, ValueType9>,
        Action<ValueType9, ValueType10>,
        Action<ValueType10, ReturnType>
    ]): void;
    /**
     *  add hook
     */
    hook<T extends SupportedHooks>(name: T, fn: (v: HookInput[T]) => void): void;
    private isActionExists;
    /**
     * this method run recursively the flow in order to allow async based function and jump between flows.
     */
    private executeRepeat;
    /**
     * start the execution process on a registered flow.
     */
    execute<T extends {
        $$: {
            done?: boolean;
            jump?: string;
        };
    }, S extends {
        $$: {
            done?: boolean;
            jump?: string;
        };
    }, U>(flowName: string, input: T, unsafe?: U): Promise<S>;
}
export {};
