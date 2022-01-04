import { describe, it } from 'mocha';
import { isEmpty, isEqual } from 'lodash';
import * as assert from 'assert';
import sinon from 'sinon';
import { expectType } from 'tsd';
import { ERROR_PREFIX, LambdaActions } from '../src';

describe('actions', () => {

  it('should route a request and pass the payload', async () => {
    const payload = { test: 'data' };
    const res = { resp: 'data' };
    const res2 = { resp: 'data2' };
    const router = new LambdaActions();
    const testCb = sinon.mock().resolves(res);
    const testCb2 = sinon.mock().resolves(res2);
    router.action('testReq', testCb);
    router.action('testReq2', testCb2);
    const returnVal = await router.fire({
      action: 'testReq',
      payload,
    });
    assert.strictEqual(res, returnVal);
    assert.strictEqual(testCb.calledOnce, true);
    assert.strictEqual(testCb.firstCall.firstArg, payload);
    assert.strictEqual(testCb2.called, false);
  });

  it('should route a request with an array as the action', async () => {
    const payload = { test: 'data' };
    const res = { resp: 'data' };
    const res2 = { resp: 'data2' };
    const router = new LambdaActions();
    const testCb = sinon.mock().resolves(res);
    const testCb2 = sinon.mock().resolves(res2);
    router.action(['get', 'testReq'], testCb);
    router.action(['post', 'testReq'], testCb2);
    const returnVal = await router.fire({
      action: ['post', 'testReq'],
      payload,
    });
    assert.strictEqual(res2, returnVal);
    assert.strictEqual(testCb.called, false);
    assert.strictEqual(testCb2.calledOnce, true);
    assert.strictEqual(testCb2.firstCall.firstArg, payload);
  });

  it('should route a request with a regexp as the action', async () => {
    const payload = { test: 'data' };
    const res = { resp: 'data' };
    const res2 = { resp: 'data2' };
    const router = new LambdaActions();
    const testCb = sinon.mock().resolves(res);
    const testCb2 = sinon.mock().resolves(res2);
    const testCb3 = sinon.mock().resolves(res);
    router.action('testReqA', testCb);
    router.action(/testreq\d{4}/i, testCb2);
    router.action('testReqB', testCb3);
    const returnVal = await router.fire({
      action: 'testReq1776',
      payload,
    });
    assert.strictEqual(res2, returnVal);
    assert.strictEqual(testCb.called, false);
    assert.strictEqual(testCb3.called, false);
    assert.strictEqual(testCb2.calledOnce, true);
    assert.strictEqual(testCb2.firstCall.firstArg, payload);
  });

  it('should throw an error if the action is not found', async () => {
    const payload = { test: 'data' };
    const res = { resp: 'data' };
    const res2 = { resp: 'data2' };
    const router = new LambdaActions();
    const testCb = sinon.mock().resolves(res);
    const testCb2 = sinon.mock().resolves(res2);
    const testCb3 = sinon.mock().resolves(res);
    router.action('testReqA', testCb);
    router.action('testReqB', testCb2);
    const invalidAction = 'testReq1776';
    await assert.rejects(router.fire({
      action: invalidAction,
      payload,
    }), { message: new RegExp(`${ERROR_PREFIX}.*'${invalidAction}'.*(404)`) });
    assert.strictEqual(testCb.called, false);
    assert.strictEqual(testCb2.called, false);
    assert.strictEqual(testCb3.called, false);
  });

  it('should not throw an error if the action is not found but opts.throwIfActionNotFound = false', async () => {
    const payload = { test: 'data' };
    const res = { resp: 'data' };
    const res2 = { resp: 'data2' };
    const router = new LambdaActions();
    const testCb = sinon.mock().resolves(res);
    const testCb2 = sinon.mock().resolves(res2);
    const testCb3 = sinon.mock().resolves(res);
    router.action('testReqA', testCb);
    router.action('testReqB', testCb2);
    const invalidAction = 'testReq1776';
    const resp = await router.fire({
      action: invalidAction,
      payload,
    }, {
      throwIfActionNotFound: false,
    });
    assert.strictEqual(resp, null);
    assert.strictEqual(testCb.called, false);
    assert.strictEqual(testCb2.called, false);
    assert.strictEqual(testCb3.called, false);
  });

  it('should not allow to register duplicate actions', async () => {
    const res = { resp: 'data' };
    const res2 = { resp: 'data2' };
    const router = new LambdaActions();
    const testCb = sinon.mock().resolves(res);
    const testCb2 = sinon.mock().resolves(res2);
    const action = 'testReqA';
    router.action(action, testCb);
    assert.throws(() => router.action('testReqA', testCb2),
      { message: `${ERROR_PREFIX} duplicate action ${action}` }
    );
  });

  it('should pass the meta when firing an action', async () => {
    const payload = { test: 'data' };
    const meta = { meta: '__extras__' };
    const res = { resp: 'data' };
    const res2 = { resp: 'data2' };
    const router = new LambdaActions();
    const testCb = sinon.mock().resolves(res);
    const testCb2 = sinon.mock().resolves(res2);
    router.action('testReq', testCb);
    router.action('testReq2', testCb2);
    const returnVal = await router.fire({
      action: 'testReq',
      payload,
      meta,
    });
    assert.strictEqual(res, returnVal);
    assert.strictEqual(testCb.calledOnce, true);
    assert.strictEqual(testCb.firstCall.args[0], payload);
    assert.strictEqual(isEqual(testCb.firstCall.args[1], meta), true);
    assert.strictEqual(testCb2.called, false);
  });

  it('should pass the meta when firing an action, even if payload is not passed', async () => {
    const meta = { meta: '__extras__' };
    const res = { resp: 'data' };
    const res2 = { resp: 'data2' };
    const router = new LambdaActions();
    const testCb = sinon.mock().resolves(res);
    const testCb2 = sinon.mock().resolves(res2);
    router.action('testReq', testCb);
    router.action('testReq2', testCb2);
    const returnVal = await router.fire({
      action: 'testReq',
      meta,
    });
    assert.strictEqual(res, returnVal);
    assert.strictEqual(testCb.calledOnce, true);
    assert.strictEqual(isEmpty(testCb.firstCall.args[0]), true);
    assert.strictEqual(isEqual(testCb.firstCall.args[1], meta), true);
    assert.strictEqual(testCb2.called, false);
  });

  it('should force all registered actions be string[] if the first one is', async () => {
    const res = { resp: 'data' };
    const res2 = { resp: 'data2' };
    const router = new LambdaActions();
    const testCb = sinon.mock().resolves(res);
    const testCb2 = sinon.mock().resolves(res2);
    router.action(['GET', 'testReqA'], testCb);
    const action = 'testReqA';
    assert.throws(() => router.action(action, testCb2),
      { message: `${ERROR_PREFIX} the action ${action} must be a string[], like the previous registered actions` }
    );
  });

  it('should force all registered actions be string|RegEx if the first one is', async () => {
    const res = { resp: 'data' };
    const res2 = { resp: 'data2' };
    const router = new LambdaActions();
    const testCb = sinon.mock().resolves(res);
    const testCb2 = sinon.mock().resolves(res2);
    router.action('testReqA', testCb);
    const invalidAction = ['POST', 'testReqA'];
    assert.throws(() => router.action(invalidAction, testCb2),
      { message: `${ERROR_PREFIX} the action ${invalidAction} must be a string|RegEx, like the previous registered actions` }
    );
  });

  it('should throw when attempting to fire a string[], when the registered actions are not all of this type', async () => {
    const payload = { test: 'data' };
    const res = { resp: 'data' };
    const res2 = { resp: 'data2' };
    const router = new LambdaActions();
    const testCb = sinon.mock().resolves(res);
    const testCb2 = sinon.mock().resolves(res2);
    const testCb3 = sinon.mock().resolves(res);
    router.action('testReqA', testCb);
    router.action('testReqB', testCb2);
    const invalidAction = ['POST', 'testReqA'];
    await assert.rejects(router.fire({
      action: invalidAction,
      payload,
    }), { message: new RegExp(`${ERROR_PREFIX}.*'${invalidAction}'.*(400)`) });
    assert.strictEqual(testCb.called, false);
    assert.strictEqual(testCb2.called, false);
    assert.strictEqual(testCb3.called, false);
  });

  it('should throw when attempting to fire a string|RegEx, when the registered actions are not all of this type', async () => {
    const payload = { test: 'data' };
    const res = { resp: 'data' };
    const res2 = { resp: 'data2' };
    const router = new LambdaActions();
    const testCb = sinon.mock().resolves(res);
    const testCb2 = sinon.mock().resolves(res2);
    const testCb3 = sinon.mock().resolves(res);
    router.action(['PUT', 'testReqA'], testCb);
    router.action(['POST', 'testReqB'], testCb2);
    const invalidAction = 'testReqA';
    await assert.rejects(router.fire({
      action: invalidAction,
      payload,
    }), { message: new RegExp(`${ERROR_PREFIX}.*'${invalidAction}'.*(400)`) });
    assert.strictEqual(testCb.called, false);
    assert.strictEqual(testCb2.called, false);
    assert.strictEqual(testCb3.called, false);
  });

  it('should throw an error if trying to fire an action when no actions were registered', async () => {
    const payload = { test: 'data' };
    const router = new LambdaActions();
    const invalidAction = 'testReqA';
    await assert.rejects(router.fire({
      action: invalidAction,
      payload,
    }), { message: new RegExp(`${ERROR_PREFIX}.*'${invalidAction}'.*(500)`) });
  });

});

describe('types', () => {

  it('should fire a string', async () => {
    interface Resp { baz: number }

    interface Payload { foo: number }
    const payload: Payload = { foo: 99 };
    interface Payload2 { foo2: number }
    const handler = async (pld: Payload): Promise<Resp> => {
      return { baz: pld.foo };
    };
    const handler2 = async (pld: Payload2): Promise<Resp> => {
      return { baz: pld.foo2 };
    };
    const handler3 = async (pld: Payload2): Promise<Resp> => {
      return { baz: pld.foo2 };
    };

    const router = new LambdaActions<Promise<Resp>>();

    type TAction = 'action1' | 'action2';
    type TPayload = Payload | Payload2;
    router.action<Payload>('action1', handler);
    router.action<Payload2>('action2', handler2);
    router.action<Payload2>(/action3/, handler3);
    const res = await router.fire<TAction, TPayload>({
      action: 'action1',
      payload,
    });
    assert.deepEqual(res, { baz: 99 });
  });

  it('should fire an array', async () => {

    // setup
    interface Response {
      calculated: number,
      word: string;
      key: string;
    }
    type ActionMeta = { am: string };
    type FiredMeta = { key: string };
    const firedMeta: FiredMeta = { key: '__key__' };

    interface Handler1Payload {
      foo1: number, bar1: number
    }
    interface Handler2Payload {
      foo2: number, bar2: number
    }
    interface Handler3Payload {
      foo3: number, bar3: number
    }

    // handlers
    const handler = async (pld: Handler1Payload, meta: FiredMeta, args: ActionMeta): Promise<Response> => {
      const word = args.am ?? '';
      const key = meta.key ?? '';
      return { calculated: pld.bar1 + pld.foo1, word, key };
    };
    const handler2 = async (pld: Handler2Payload, meta: FiredMeta, args: ActionMeta): Promise<Response> => {
      const word = args?.am ?? '';
      const key = meta.key ?? '';
      return { calculated: pld.foo2 + pld.bar2, word, key };
    };
    const handler3 = async (pld: Handler3Payload, meta: FiredMeta, args: ActionMeta): Promise<Response> => {
      const word = args?.am ?? '';
      const key = meta?.key ?? '';
      return { calculated: pld.foo3 + pld.bar3, word, key };
    };

    // init
    const router = new LambdaActions<FiredMeta, ActionMeta>();

    // define actions
    router.action<Handler1Payload, Promise<Response>>(['GET', 'action1'], handler, { am: 'one' });
    router.action<Handler2Payload, Promise<Response>>(['POST', 'action2'], handler2, { am: 'two' });
    router.action<Handler3Payload, Promise<Response>>(['PUT', 'action3'], handler3, { am: 'three' });

    // fire
    type TAction = ['GET' | 'POST' | 'PUT', 'action1' | 'action2' | 'action3'];
    type TPayload = Handler1Payload | Handler2Payload | Handler3Payload;
    const payload: TPayload = { foo3: 17, bar3: 19 };
    const res = await router.fire<TAction, TPayload>({
      action: ['PUT', 'action3'],
      payload,
      meta: firedMeta,
    });
    assert.deepEqual(res?.calculated, 36);
    assert.deepEqual(res?.word, 'three');
    assert.deepEqual(res?.key, '__key__');
    if (res) {
      expectType<Response>(res);
    }

  });

});