export declare const ERROR_PREFIX = "LambdaActions:";
declare type ActionPattern = string | string[] | RegExp;
interface LambdaAction<TPayload = any, TResponse = any, TMeta = any, TActionArgs = any> {
    pattern: ActionPattern;
    handler: (() => TResponse) | ((payload: TPayload) => TResponse) | ((payload: TPayload, meta: TMeta) => TResponse) | ((payload: TPayload, meta: TMeta, actionArgs: TActionArgs) => TResponse);
    actionArgs?: TActionArgs;
}
interface FireArgs<TAction = string | string[], TPayload = object, TMeta = object | any[]> {
    action: TAction;
    payload?: TPayload;
    meta?: TMeta;
}
interface LambdaActionsOptions {
    throwIfActionNotFound?: boolean;
}
export declare class LambdaActions<TMeta = any, TActionArgs = any> {
    private actions;
    private opts;
    action: <TPayload = any, TResponse = any>(pattern: ActionPattern, handler: (() => TResponse) | ((payload: TPayload) => TResponse) | ((payload: TPayload, meta: TMeta) => TResponse) | ((payload: TPayload, meta: TMeta, actionArgs: TActionArgs) => TResponse), actionArgs?: TActionArgs | undefined) => void;
    fire: <TAction = string | string[], TPayload = object>(args: FireArgs<TAction, TPayload, TMeta>, opts?: LambdaActionsOptions | undefined) => Promise<any | null>;
    private isArrayOfStrings;
    private isAllActionsStringOrRegexp;
    private isAllActionsArrays;
    private findFirstArrayMatch;
    private findFirstStringMatch;
    private checkPatternCompatability;
}
export {};
