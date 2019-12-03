export class Flows {
    constructor() {
        this.hooks = new Map([
            ['pre_action', []],
            ['post_action', []],
            ['pre_flow', []],
            ['post_flow', []],
            ['exception', []]
        ]);
        this.flows = new Map();
        this.executeRepeat = this.executeRepeat.bind(this);
    }
    /**
     * register flow
     * @param {string} name the name of the flow
     * @param {function[]} actions an array of functions
     */
    register(name, actions) {
        this.flows.set(name, actions);
    }
    /**
     *  add hook
     * @param {supportedHooks} name the name of the hook
     * @param {hook} fn the function to execute
     */
    hook(name, fn) {
        if (!this.hooks.has(name)) {
            throw new Error(`Hook ${name} is not a known hook, please read the docs regarding acceptable hooks`);
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
    async executeRepeat(flowName, data, unsafe, i) {
        const flow = this.flows.get(flowName);
        const action = flow && flow[i];
        const actionData = JSON.parse(JSON.stringify(data));
        let nextActionData = {};
        /** post_flow hook */
        if (!flow || !action || (actionData.__flows && actionData.__flows.done)) {
            this.hooks.get('post_flow').forEach(fn => fn({ flowName, output: actionData }));
            return actionData;
        }
        /** pre_action hook */
        this.hooks.get('pre_action').forEach(fn => fn({ flowName, i, actionFn: this.flows.get(flowName)[i], input: actionData }));
        try {
            /** execution */
            const result = await this.flows.get(flowName)[i](actionData, unsafe);
            nextActionData = result || {};
            /** exception hook */
        }
        catch (error) {
            this.hooks.get('exception').forEach(fn => fn({ flowName, i, actionFn: this.flows.get(flowName)[i], input: actionData, error }));
            nextActionData = { ...actionData, __flows: { error } };
            return nextActionData;
        }
        /** post_action hook */
        this.hooks.get('post_action').forEach(fn => fn({ flowName, i, actionFn: this.flows.get(flowName)[i], input: actionData, output: nextActionData }));
        /** next action */
        if (nextActionData.__flows && nextActionData.__flows.jump) {
            const jumpTo = nextActionData.__flows.jump;
            delete nextActionData.__flows;
            return await this.executeRepeat(jumpTo, nextActionData, unsafe, 0);
        }
        return await this.executeRepeat(flowName, nextActionData, unsafe, i + 1);
    }
    /**
     * start the execution process on a registered flow.
     * @param {string} flowName
     * @param {object} input
     */
    async execute(flowName, input, unsafe) {
        const data = JSON.parse(JSON.stringify(input));
        if (!this.flows.has(flowName)) {
            console.warn(`${flowName} flow does not exists! Skipped`);
            return input;
        }
        /** pre_flow hook */
        this.hooks.get('pre_flow').forEach(fn => fn({ flowName: flowName, input: data }));
        return await this.executeRepeat(flowName, data, unsafe, 0);
    }
}
