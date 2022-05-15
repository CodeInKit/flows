"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.Flows = exports.SupportedHooks = void 0;
var SupportedHooks;
(function (SupportedHooks) {
    SupportedHooks["PRE_ACTION"] = "PRE_ACTION";
    SupportedHooks["POST_ACTION"] = "POST_ACTION";
    SupportedHooks["PRE_FLOW"] = "PRE_FLOW";
    SupportedHooks["POST_FLOW"] = "POST_FLOW";
    SupportedHooks["EXCEPTION"] = "EXCEPTION";
})(SupportedHooks = exports.SupportedHooks || (exports.SupportedHooks = {}));
var Flows = /** @class */ (function () {
    function Flows() {
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
    Flows.prototype.getHook = function (hookName) {
        var hook = this.hooks.get(hookName);
        if (!Array.isArray(hook)) {
            throw new Error("Hook ".concat(hookName, " is not a known hook, please read the docs regarding acceptable hooks"));
        }
        return hook;
    };
    Flows.prototype.getAction = function (flowName, i) {
        var flow = this.flows.get(flowName);
        if (!Array.isArray(flow) || !flow[i]) {
            throw new Error('flow does not exists!');
        }
        return flow[i];
    };
    Flows.prototype.register = function (name, flow) {
        this.flows.set(name, flow);
    };
    /**
     *  add hook
     */
    Flows.prototype.hook = function (name, fn) {
        var hook = this.getHook(name);
        hook.push(fn);
    };
    Flows.prototype.isActionExists = function (flowName, i) {
        var flow = this.flows.get(flowName);
        return Array.isArray(flow)
            && (({}).toString.call(flow[i]) === '[object Function]' || ({}).toString.call(flow[i]) === '[object AsyncFunction]');
    };
    /**
     * this method run recursively the flow in order to allow async based function and jump between flows.
     */
    Flows.prototype.executeRepeat = function (flowName, data, unsafe, i, meta) {
        if (meta === void 0) { meta = { activated: [] }; }
        return __awaiter(this, void 0, void 0, function () {
            var action, actionData, nextActionData, lastFlow, result, error_1, jumpTo;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        action = this.isActionExists(flowName, i) ? this.getAction(flowName, i) : null;
                        actionData = JSON.parse(JSON.stringify(data));
                        nextActionData = { $$: actionData.$$ };
                        lastFlow = meta.activated.length > 0 ? meta.activated[meta.activated.length - 1] : null;
                        if (flowName !== lastFlow && meta.activated.indexOf(flowName) === -1) {
                            meta.activated.push(flowName);
                        }
                        else if (flowName !== lastFlow) {
                            throw new Error("cyclic flow!!, [".concat(meta.activated.join(', '), ", ").concat(flowName, "]"));
                        }
                        /** POST_FLOW hook */
                        if (!action || (actionData.$$ && actionData.$$.done)) {
                            if (!actionData.$$)
                                actionData.$$ = {};
                            this.getHook(SupportedHooks.POST_FLOW).forEach(function (fn) { return fn({ flowName: flowName, output: actionData }); });
                            return [2 /*return*/, JSON.parse(JSON.stringify(actionData))];
                        }
                        /** PRE_ACTION hook */
                        this.getHook(SupportedHooks.PRE_ACTION).forEach(function (fn) { return fn({ flowName: flowName, i: i, actionFn: _this.getAction(flowName, i), input: actionData }); });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (this.getAction(flowName, i)(actionData, unsafe))];
                    case 2:
                        result = _a.sent();
                        if (typeof result !== 'object') {
                            throw new Error("in flow ".concat(flowName, " action number ").concat(i, " return \"").concat(result, "\" instead of object!\nactions must return object"));
                        }
                        Object.assign(nextActionData, result);
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.getHook(SupportedHooks.EXCEPTION).forEach(function (fn) { return fn({ flowName: flowName, i: i, actionFn: _this.getAction(flowName, i), input: actionData, error: error_1 }); });
                        throw error_1;
                    case 4:
                        /** POST_ACTION hook */
                        this.getHook(SupportedHooks.POST_ACTION).forEach(function (fn) { return fn({ flowName: flowName, i: i, actionFn: _this.getAction(flowName, i), input: actionData, output: nextActionData }); });
                        if (!(nextActionData.$$ && nextActionData.$$.jump)) return [3 /*break*/, 6];
                        jumpTo = nextActionData.$$.jump;
                        delete nextActionData.$$.jump;
                        return [4 /*yield*/, this.executeRepeat(jumpTo, nextActionData, unsafe, 0, meta)];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6: return [4 /*yield*/, this.executeRepeat(flowName, nextActionData, unsafe, i + 1, meta)];
                    case 7: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * start the execution process on a registered flow.
     */
    Flows.prototype.execute = function (flowName, input, unsafe) {
        // We make sure that data is serializable
        var data = JSON.parse(JSON.stringify(input));
        if (!this.flows.has(flowName)) {
            console.warn("".concat(flowName, " flow does not exists! Skipped"));
            return Promise.resolve(data);
        }
        /** PRE_FLOW hook */
        this.getHook(SupportedHooks.PRE_FLOW).forEach(function (fn) { return fn({ flowName: flowName, input: data }); });
        return this.executeRepeat(flowName, data, unsafe || {}, 0);
    };
    return Flows;
}());
exports.Flows = Flows;
