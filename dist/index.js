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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaActions = exports.ERROR_PREFIX = void 0;
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
exports.ERROR_PREFIX = 'LambdaActions:';
class LambdaActions {
    constructor() {
        this.actions = [];
        this.opts = {
            throwIfActionNotFound: true,
        };
        this.action = (pattern, handler, actionArgs) => {
            this.checkPatternCompatability(pattern);
            if (!Array.isArray(pattern) && !(pattern instanceof RegExp) && !(typeof pattern === 'string')) {
                throw Error(`${exports.ERROR_PREFIX} action ${pattern} must be of type: string | string[] | RegExp`);
            }
            if (this.actions.findIndex(a => (0, lodash_isequal_1.default)(a.pattern, pattern)) > -1) {
                throw Error(`${exports.ERROR_PREFIX} duplicate action ${pattern}`);
            }
            this.actions.push({ pattern, handler, actionArgs });
        };
        this.fire = (args, opts) => __awaiter(this, void 0, void 0, function* () {
            if (opts) {
                this.opts = opts;
            }
            if (!this.actions.length) {
                throw Error(`${exports.ERROR_PREFIX} trying to fire '${args.action}' before registering any actions (500)`);
            }
            let actionMatch;
            if (typeof args.action === 'string') {
                if (!this.isAllActionsStringOrRegexp()) {
                    throw Error(`${exports.ERROR_PREFIX} the fired action (string) '${args.action}' is incompatible with the registered action arrays (400)`);
                }
                actionMatch = this.findFirstStringMatch(args.action);
            }
            else if (this.isArrayOfStrings(args.action)) {
                if (!this.isAllActionsArrays()) {
                    throw Error(`${exports.ERROR_PREFIX} the fired action (string[]) '${args.action}' is incompatible with the registered actions (string|RegExp) (400)`);
                }
                actionMatch = this.findFirstArrayMatch(args.action);
            }
            else {
                throw Error(`${exports.ERROR_PREFIX} the fired action ${args.action} must be one of: string[] | string (400)`);
            }
            if (!actionMatch) {
                if (this.opts.throwIfActionNotFound === true) {
                    throw Error(`${exports.ERROR_PREFIX} the fired action '${args.action}' wasn't matched (404)`);
                }
                else {
                    return null;
                }
            }
            return actionMatch.handler(args.payload, args.meta, actionMatch.actionArgs);
        });
        this.isArrayOfStrings = (arr) => {
            return Array.isArray(arr) && arr.every(i => typeof i === 'string');
        };
        this.isAllActionsStringOrRegexp = () => {
            return this.actions.every(a => a.pattern instanceof RegExp || typeof a.pattern === 'string');
        };
        this.isAllActionsArrays = () => {
            return this.actions.every(a => Array.isArray(a.pattern));
        };
        this.findFirstArrayMatch = (actionName) => {
            const match = this.actions.find(a => (0, lodash_isequal_1.default)(a.pattern, actionName));
            return match;
        };
        this.findFirstStringMatch = (actionName) => {
            const match = this.actions.find(a => {
                if (typeof a.pattern === 'string') {
                    return a.pattern === actionName;
                }
                else if (a.pattern instanceof RegExp) {
                    return a.pattern.test(actionName);
                }
                return false;
            });
            return match;
        };
        this.checkPatternCompatability = (newPattern) => {
            if (!this.actions.length) {
                return true;
            }
            const lastAction = this.actions[this.actions.length - 1];
            if (Array.isArray(lastAction.pattern) !== Array.isArray(newPattern)) {
                if (Array.isArray(newPattern)) {
                    throw Error(`${exports.ERROR_PREFIX} the action ${newPattern} must be a string|RegEx, like the previous registered actions`);
                }
                else {
                    throw Error(`${exports.ERROR_PREFIX} the action ${newPattern} must be a string[], like the previous registered actions`);
                }
            }
            return true;
        };
    }
}
exports.LambdaActions = LambdaActions;
