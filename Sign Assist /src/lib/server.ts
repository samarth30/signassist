import config from '../config';

import logger from './logger';
import type { Transaction } from './simulate_request_reply';
import { Simulation } from './simulation';

const log = logger.child({ component: 'Server' });

// Will change depending on if dev or not.
const SERVER_URL = config.server;

log.info(SERVER_URL, 'SERVER_URL');

export enum ResponseType {
  Success = 'success',
  Revert = 'revert',
  Error = 'error',
}

export interface Response {
  type: ResponseType;

  // Only set on success.
  simulation?: Simulation;

  // Might be set on error.
  error?: string;
}

export const fetchSimulate = async (args: {
  website: string;
  chainId: string;
  transaction: Transaction;
}): Promise<Response> => {
  log.info(args, 'Fetch simulate');
  try {
    console.log(args.transaction);
    var raw = JSON.stringify({
      website: args.website,
      transactionParameters: [
        {
          ...args.transaction,
        },
      ],
    });
    console.log(raw);
    const result = await fetch(`${SERVER_URL}`, {
      method: 'POST',
      headers: {
        // Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: raw,
      redirect: 'follow',
    });
    console.log(result);
    if (result.status === 200) {
      log.info('Fetch success');
      console.log(result);
      const data = await result.json();

      if (data.success) {
        return {
          type: ResponseType.Success,
          simulation: Simulation.fromJSON(data.simulation),
        };
      }
      return {
        type: ResponseType.Revert,
        error: data.error,
      };
    }
    const { error } = await result.json();
    log.info({ error, msg: 'Error with the request' });
    return { type: ResponseType.Error, error };
  } catch (e: any) {
    log.warn(e, 'Error simulation');
    return { error: e.message, type: ResponseType.Error };
  }
};
