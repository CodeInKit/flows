export var SupportedHooks;
(function (SupportedHooks) {
    SupportedHooks[SupportedHooks["pre_action"] = 'pre_action'] = "pre_action";
    SupportedHooks[SupportedHooks["post_action"] = 'post_action'] = "post_action";
    SupportedHooks[SupportedHooks["pre_flow"] = 'pre_flow'] = "pre_flow";
    SupportedHooks[SupportedHooks["post_flow"] = 'post_flow'] = "post_flow";
    SupportedHooks[SupportedHooks["exception"] = 'exception'] = "exception";
})(SupportedHooks || (SupportedHooks = {}));
export class Flows {
    constructor() {
        this.hooks = new Map([
            [SupportedHooks.pre_action, []],
            [SupportedHooks.post_action, []],
            [SupportedHooks.pre_flow, []],
            [SupportedHooks.post_flow, []],
            [SupportedHooks.exception, []]
        ]);
        this.flows = new Map();
        /**
         * this method run recursively the flow in order to allow async based function and jump between flows.
         *
         * @param flowName the name of the flow
         * @param data the data pass to the flow
         * @param i the index number of the action in the flow
         */
        this.async = executeRepeat(flowName, string, data, T, unsafe, U, i, number, meta, IMeta = { activated: [], requestId: '' });
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
    /**
     * register flow
     * @param {string} name the name of the flow
     * @param {function[]} flow an array of functions
     */
    register(name, flow) {
        this.flows.set(name, flow);
    }
    /**
     *  add hook
     * @param {SupportedHooks} name the name of the hook
     * @param {Hook} fn the function to execute
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
    Promise() {
        const action = this.isActionExists(flowName, i) ? this.getAction(flowName, i) : null;
        const actionData = JSON.parse(JSON.stringify(data));
        let nextActionData = { __flows: actionData.__flows }, as = S;
        let lastFlow = meta.activated.length > 0 ? meta.activated[meta.activated.length - 1] : null;
        if (actionData.__flows && actionData.__flows.requestId) {
            meta.requestId = actionData.__flows.requestId;
        }
        if (flowName !== lastFlow && meta.activated.indexOf(flowName) === -1) {
            meta.activated.push(flowName);
        }
        else if (flowName !== lastFlow) {
            throw new Error(`cyclic flow!!, [${meta.activated.join(', ')}, ${flowName}]`);
        }
        /** post_flow hook */
        if (!action || (actionData.__flows && actionData.__flows.done)) {
            if (!actionData.__flows)
                actionData.__flows = {};
            actionData.__flows.requestId = meta.requestId;
            this.getHook(SupportedHooks.post_flow).forEach(fn => fn({ flowName, output: actionData }));
            return JSON.parse(JSON.stringify(actionData));
        }
        /** pre_action hook */
        this.getHook(SupportedHooks.pre_action).forEach(fn => fn({ flowName, i, actionFn: this.getAction(flowName, i), input: actionData }));
        try {
            /** execution */
            const result = await;
            this.getAction(flowName, i)(actionData, unsafe);
            if (typeof result !== 'object') {
                throw new Error(`in flow ${flowName} action number ${i} return "${result}" instead of object!\nactions must return object`);
            }
            Object.assign(nextActionData, result);
        }
        catch (error) {
            this.getHook(SupportedHooks.exception).forEach(fn => fn({ flowName, i, actionFn: this.getAction(flowName, i), input: actionData, error: error, as: Error }));
            throw error;
        }
        /** post_action hook */
        this.getHook(SupportedHooks.post_action).forEach(fn => fn({ flowName, i, actionFn: this.getAction(flowName, i), input: actionData, output: nextActionData }));
        /** next action */
        if (nextActionData.__flows && nextActionData.__flows.jump) {
            const jumpTo = nextActionData.__flows.jump;
            delete nextActionData.__flows.jump;
            return await;
            this.executeRepeat(jumpTo, nextActionData, unsafe, 0, meta);
        }
        return await;
        this.executeRepeat(flowName, nextActionData, unsafe, i + 1, meta);
    }
    /**
     * start the execution process on a registered flow.
     * @param {string} flowName
     * @param {object} input
     */
    execute(flowName, input, unsafe) {
        // We make sure that data is serializable
        const data = JSON.parse(JSON.stringify(input));
        if (!this.flows.has(flowName)) {
            console.warn(`${flowName} flow does not exists! Skipped`);
            return Promise.resolve(data);
        }
        /** pre_flow hook */
        this.getHook(SupportedHooks.pre_flow).forEach(fn => fn({ flowName: flowName, input: data, as: T }));
        return this.executeRepeat(flowName, data, as, T, unsafe || {}, 0);
    }
}
