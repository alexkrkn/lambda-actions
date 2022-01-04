/* eslint-disable @typescript-eslint/no-explicit-any */
import isEqual from 'lodash.isequal';

export const ERROR_PREFIX = 'LambdaActions:'

type ActionPattern = string | string[] | RegExp;

interface LambdaAction<TPayload = any, TResponse = any, TMeta = any, TActionArgs = any> {
  pattern: ActionPattern,
  handler:
  (() => TResponse) |
  ((payload: TPayload) => TResponse) |
  ((payload: TPayload, meta: TMeta) => TResponse) |
  ((payload: TPayload, meta: TMeta, actionArgs: TActionArgs) => TResponse),
  actionArgs?: TActionArgs,
}

interface FireArgs<TAction = string | string[], TPayload = object, TMeta = object | any[]> {
  action: TAction;
  payload?: TPayload;
  meta?: TMeta;
}

interface LambdaActionsOptions {
  throwIfActionNotFound?: boolean;
}

export class LambdaActions<TMeta = any, TActionArgs = any> {

  private actions: LambdaAction[] = [];
  private opts: LambdaActionsOptions = {
    throwIfActionNotFound: true,
  }

  public action = <TPayload = any, TResponse = any>(pattern: ActionPattern, handler: LambdaAction<TPayload, TResponse, TMeta, TActionArgs>['handler'], actionArgs?: TActionArgs) => {
    // check that the new pattern is compatible with the types of prev patterns (don't mix arrays with non-arrays)
    this.checkPatternCompatability(pattern);
    if (!Array.isArray(pattern) && !(pattern instanceof RegExp) && !(typeof pattern === 'string')) {
      throw Error(`${ERROR_PREFIX} action ${pattern} must be of type: string | string[] | RegExp`);
    }
    if (this.actions.findIndex(a => isEqual(a.pattern, pattern)) > -1) {
      throw Error(`${ERROR_PREFIX} duplicate action ${pattern}`);
    }
    this.actions.push({ pattern, handler, actionArgs });
  }

  public fire = async <TAction = string | string[], TPayload = object>(args: FireArgs<TAction, TPayload, TMeta>, opts?: LambdaActionsOptions): Promise<any | null> => {
    if (opts) {
      this.opts = opts;
    }
    if (!this.actions.length) {
      throw Error(`${ERROR_PREFIX} trying to fire '${args.action}' before registering any actions (500)`);
    }
    let actionMatch: LambdaAction | undefined;
    if (typeof args.action === 'string') {
      if (!this.isAllActionsStringOrRegexp()) {
        throw Error(`${ERROR_PREFIX} the fired action (string) '${args.action}' is incompatible with the registered action arrays (400)`);
      }
      actionMatch = this.findFirstStringMatch(args.action);
    } else if (this.isArrayOfStrings<TAction>(args.action)) {
      if (!this.isAllActionsArrays()) {
        throw Error(`${ERROR_PREFIX} the fired action (string[]) '${args.action}' is incompatible with the registered actions (string|RegExp) (400)`);
      }
      actionMatch = this.findFirstArrayMatch<TAction>(args.action);
    } else {
      throw Error(`${ERROR_PREFIX} the fired action ${args.action} must be one of: string[] | string (400)`);
    }
    if (!actionMatch) {
      if (this.opts.throwIfActionNotFound === true) {
        throw Error(`${ERROR_PREFIX} the fired action '${args.action}' wasn't matched (404)`);
      } else {
        return null;
      }
    }
    return actionMatch.handler(args.payload, args.meta, actionMatch.actionArgs);
  };

  private isArrayOfStrings = <TAction>(arr: TAction): boolean => {
    return Array.isArray(arr) && arr.every(i => typeof i === 'string');
  };

  private isAllActionsStringOrRegexp = (): boolean => {
    return this.actions.every(a => a.pattern instanceof RegExp || typeof a.pattern === 'string');
  };

  private isAllActionsArrays = (): boolean => {
    return this.actions.every(a => Array.isArray(a.pattern));
  };

  private findFirstArrayMatch = <TAction>(actionName: TAction): LambdaAction | undefined => {
    const match = this.actions.find(a => isEqual(a.pattern, actionName));
    return match;
  };

  private findFirstStringMatch = (actionName: string): LambdaAction | undefined => {
    const match = this.actions.find(a => {
      if (typeof a.pattern === 'string') {
        return a.pattern === actionName;
      } else if (a.pattern instanceof RegExp) {
        return a.pattern.test(actionName);
      }
      return false;
    });
    return match;
  };

  private checkPatternCompatability = (newPattern: ActionPattern): boolean => {
    if (!this.actions.length) {
      return true;
    }
    const lastAction = this.actions[this.actions.length - 1];
    if (Array.isArray(lastAction.pattern) !== Array.isArray(newPattern)) {
      if (Array.isArray(newPattern)) {
        throw Error(`${ERROR_PREFIX} the action ${newPattern} must be a string|RegEx, like the previous registered actions`);
      } else {
        throw Error(`${ERROR_PREFIX} the action ${newPattern} must be a string[], like the previous registered actions`);
      }
    }
    return true;
  };

}