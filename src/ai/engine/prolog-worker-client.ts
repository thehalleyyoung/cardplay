/**
 * @fileoverview Prolog Worker Client
 *
 * Thin client for talking to `prolog-worker.ts`.
 *
 * This is intentionally optional: callers can keep using the main-thread
 * PrologAdapter unless they explicitly choose the worker path.
 *
 * @module @cardplay/ai/engine/prolog-worker-client
 */

import type { QueryOptions, QueryResult } from './prolog-adapter';

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

function isWorkerAvailable(): boolean {
  return typeof Worker !== 'undefined';
}

function randomId(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export class PrologWorkerClient {
  private readonly worker: Worker;
  private readonly pending = new Map<
    RequestId,
    { resolve: (value: unknown) => void; reject: (err: Error) => void }
  >();

  constructor(worker?: Worker) {
    if (worker) {
      this.worker = worker;
    } else {
      if (!isWorkerAvailable()) {
        throw new Error('Web Workers are not available in this environment.');
      }
      this.worker = new Worker(new URL('./prolog-worker.ts', import.meta.url), { type: 'module' });
    }

    this.worker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      this.pending.delete(msg.id);

      if (msg.type === 'error') {
        entry.reject(new Error(msg.error));
        return;
      }
      entry.resolve(msg.result);
    });

    this.worker.addEventListener('error', (e) => {
      const err = e instanceof ErrorEvent ? e.error : new Error('Worker error');
      for (const [, entry] of this.pending) {
        entry.reject(err instanceof Error ? err : new Error(String(err)));
      }
      this.pending.clear();
    });
  }

  terminate(): void {
    this.worker.terminate();
    for (const [, entry] of this.pending) {
      entry.reject(new Error('Worker terminated'));
    }
    this.pending.clear();
  }

  private request<T>(msg: Omit<WorkerRequest, 'id'>): Promise<T> {
    const id = randomId();
    const payload = { id, ...msg } as WorkerRequest;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as any, reject });
      this.worker.postMessage(payload);
    });
  }

  async loadProgram(prologCode: string, programId?: string): Promise<boolean> {
    const payload: Omit<WorkerRequest, 'id'> & { type: 'loadProgram'; prologCode: string; programId?: string } = 
      programId !== undefined 
        ? { type: 'loadProgram', prologCode, programId }
        : { type: 'loadProgram', prologCode };
    const result = await this.request<boolean>(payload);
    return result;
  }

  async query(queryString: string, options?: QueryOptions): Promise<QueryResult> {
    const payload: Omit<WorkerRequest, 'id'> & { type: 'query'; queryString: string; options?: QueryOptions } = 
      options !== undefined
        ? { type: 'query', queryString, options }
        : { type: 'query', queryString };
    const result = await this.request<QueryResult>(payload);
    return result;
  }

  async reset(): Promise<boolean> {
    const result = await this.request<boolean>({ type: 'reset' });
    return result;
  }
}

