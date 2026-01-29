/**
 * @fileoverview Prolog Web Worker
 *
 * Runs a PrologAdapter inside a Web Worker so heavy KB loads / queries can
 * happen off the main thread (optional optimization).
 *
 * L013: Prolog worker
 *
 * @module @cardplay/ai/engine/prolog-worker
 */

import { PrologAdapter, type QueryOptions } from './prolog-adapter';

type RequestId = string;

type WorkerRequest =
  | {
      readonly id: RequestId;
      readonly type: 'loadProgram';
      readonly prologCode: string;
      readonly programId?: string;
    }
  | {
      readonly id: RequestId;
      readonly type: 'query';
      readonly queryString: string;
      readonly options?: QueryOptions;
    }
  | {
      readonly id: RequestId;
      readonly type: 'reset';
    };

type WorkerResponse =
  | {
      readonly id: RequestId;
      readonly type: 'result';
      readonly result: unknown;
    }
  | {
      readonly id: RequestId;
      readonly type: 'error';
      readonly error: string;
    };

const ctx = self as typeof globalThis & {
  postMessage(message: WorkerResponse): void;
  addEventListener(type: 'message', listener: (e: MessageEvent<WorkerRequest>) => void): void;
};

let adapter: PrologAdapter = new PrologAdapter();
let ready: Promise<void> = adapter.initialize();

function reply(message: WorkerResponse): void {
  ctx.postMessage(message);
}

ctx.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  try {
    await ready;

    switch (msg.type) {
      case 'loadProgram': {
        const ok = await adapter.loadProgram(msg.prologCode, msg.programId);
        reply({ id: msg.id, type: 'result', result: ok });
        return;
      }

      case 'query': {
        const result = await adapter.query(msg.queryString, msg.options);
        reply({ id: msg.id, type: 'result', result });
        return;
      }

      case 'reset': {
        adapter.reset();
        ready = adapter.initialize();
        reply({ id: msg.id, type: 'result', result: true });
        return;
      }
    }
  } catch (err) {
    reply({
      id: msg.id,
      type: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

