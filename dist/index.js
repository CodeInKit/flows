var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export var SupportedHooks;
(function (SupportedHooks) {
    SupportedHooks["PRE_ACTION"] = "PRE_ACTION";
    SupportedHooks["POST_ACTION"] = "POST_ACTION";
    SupportedHooks["PRE_FLOW"] = "PRE_FLOW";
    SupportedHooks["POST_FLOW"] = "POST_FLOW";
    SupportedHooks["EXCEPTION"] = "EXCEPTION";
})(SupportedHooks || (SupportedHooks = {}));
export class Flows {
    constructor() {
        this.hooks = new Map([
            [SupportedHooks.PRE_ACTION, []],
            [SupportedHooks.POST_ACTION, []],
            [SupportedHooks.PRE_FLOW, []],
            [SupportedHooks.POST_FLOW, []],
            [SupportedHooks.EXCEPTION, []]
        ]);
        this.flows = new Map();
        this.executeRepeat = this.executeRepeat.bind(this);
    }
    getHook(hookName) {
        const hook = this.hooks.get(hookName);
        if (!Array.isArray(hook)) {
            throw new Error(`Hook ${hookName} is not a known hook, please read the docs regarding acceptable hooks`);
        }
        return hook;
    }
    getAction(flowName, i) {
        const flow = this.flows.get(flowName);
        if (!Array.isArray(flow) || !flow[i]) {
            throw new Error('flow does not exists!');
        }
        return flow[i];
    }
    register(name, flow) {
        this.flows.set(name, flow);
    }
    /**
     *  add hook
     */
    hook(name, fn) {
        const hook = this.getHook(name);
        hook.push(fn);
    }
    isActionExists(flowName, i) {
        const flow = this.flows.get(flowName);
        return Array.isArray(flow)
            && (({}).toString.call(flow[i]) === '[object Function]' || ({}).toString.call(flow[i]) === '[object AsyncFunction]');
    }
    /**
     * this method run recursively the flow in order to allow async based function and jump between flows.
     */
    executeRepeat(flowName, data, unsafe, i, meta = { activated: [] }) {
        return __awaiter(this, void 0, void 0, function* () {
            const action = this.isActionExists(flowName, i) ? this.getAction(flowName, i) : null;
            const actionData = JSON.parse(JSON.stringify(data));
            let nextActionData = { $$: actionData.$$ };
            let lastFlow = meta.activated.length > 0 ? meta.activated[meta.activated.length - 1] : null;
            if (flowName !== lastFlow && meta.activated.indexOf(flowName) === -1) {
                meta.activated.push(flowName);
            }
            else if (flowName !== lastFlow) {
                throw new Error(`cyclic flow!!, [${meta.activated.join(', ')}, ${flowName}]`);
            }
            /** POST_FLOW hook */
            if (!action || (actionData.$$ && actionData.$$.done)) {
                if (!actionData.$$)
                    actionData.$$ = {};
                this.getHook(SupportedHooks.POST_FLOW).forEach(fn => fn({ flowName, output: actionData }));
                return JSON.parse(JSON.stringify(actionData));
            }
            /** PRE_ACTION hook */
            this.getHook(SupportedHooks.PRE_ACTION).forEach(fn => fn({ flowName, i, actionFn: this.getAction(flowName, i), input: actionData }));
            try {
                /** execution */
                const result = this.getAction(flowName, i)(actionData, unsafe);
                if (typeof result !== 'object') {
                    throw new Error(`in flow ${flowName} action number ${i} return "${result}" instead of object!\nactions must return object`);
                }
                Object.assign(nextActionData, result);
                /** EXCEPTION hook */
            }
            catch (error) {
                this.getHook(SupportedHooks.EXCEPTION).forEach(fn => fn({ flowName, i, actionFn: this.getAction(flowName, i), input: actionData, error: error }));
                throw error;
            }
            /** POST_ACTION hook */
            this.getHook(SupportedHooks.POST_ACTION).forEach(fn => fn({ flowName, i, actionFn: this.getAction(flowName, i), input: actionData, output: nextActionData }));
            /** next action */
            if (nextActionData.$$ && nextActionData.$$.jump) {
                const jumpTo = nextActionData.$$.jump;
                delete nextActionData.$$.jump;
                return yield this.executeRepeat(jumpTo, nextActionData, unsafe, 0, meta);
            }
            return yield this.executeRepeat(flowName, nextActionData, unsafe, i + 1, meta);
        });
    }
    /**
     * start the execution process on a registered flow.
     */
    execute(flowName, input, unsafe) {
        // We make sure that data is serializable
        const data = JSON.parse(JSON.stringify(input));
        if (!this.flows.has(flowName)) {
            console.warn(`${flowName} flow does not exists! Skipped`);
            return Promise.resolve(data);
        }
        /** PRE_FLOW hook */
        this.getHook(SupportedHooks.PRE_FLOW).forEach(fn => fn({ flowName: flowName, input: data }));
        return this.executeRepeat(flowName, data, unsafe || {}, 0);
    }
}
