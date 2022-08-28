import { v4 as uuidv4 } from 'uuid';

export interface Transaction {
  from: string;

  to: string;

  data?: string;

  value?: string;
}

export interface SimulateRequestArgs {
  id: string;

  website: string;

  chainId: string;

  transaction: Transaction;
}

export const SIMULATE_REQUEST_COMMAND = 'simulate';

export class RequestManager {
  mappings: Map<string, (args: SimulateResponse) => void> = new Map();

  constructor() {
    this.mappings = new Map();

    document.addEventListener(DISPATCH_SIMULATE_RESPONSE, (event: any) => {
      this._handleSimulateResponse(event.detail);
    });
  }

  public request(args: {
    website: string;
    chainId: string;
    transaction: Transaction;
  }): Promise<SimulateResponse> {
    console.log(args, 'args');
    return new Promise((resolve) => {
      const request = this._createSimulateRequest(args);
      this.mappings.set(request.id, resolve);

      this._dispatchSimulateRequest(request);
    });
  }

  private _createSimulateRequest(args: {
    website: string;
    chainId: string;
    transaction: Transaction;
  }): SimulateRequestArgs {
    return {
      id: uuidv4(),
      website: args.website,
      chainId: args.chainId,
      transaction: args.transaction,
    };
  }

  private _dispatchSimulateRequest = (simulateRequest: SimulateRequestArgs) => {
    document.dispatchEvent(
      new CustomEvent(DISPATCH_SIMULATE_REQUEST, {
        detail: simulateRequest,
      })
    );
  };

  private _handleSimulateResponse = (
    simulateResponse: SimulateResponseWrapped
  ) => {
    const resolver = this.mappings.get(simulateResponse.id);
    if (!resolver) {
      // Could be a stale request or for another webpage.
      return;
    }

    resolver(simulateResponse.type);

    this.mappings.delete(simulateResponse.id);
  };
}

const DISPATCH_SIMULATE_REQUEST = 'SIGN_ASSIST_DISPATCH_SIMULATE_REQUEST';

export const listenToSimulateRequest = (
  callback: (simulateRequest: SimulateRequestArgs) => void
) => {
  document.addEventListener(DISPATCH_SIMULATE_REQUEST, (event: any) => {
    callback(event.detail);
  });
};

export enum SimulateResponse {
  Reject,
  Continue,
  Error,
}

interface SimulateResponseWrapped {
  id: string;
  type: SimulateResponse;
}

const DISPATCH_SIMULATE_RESPONSE = 'SIGN_ASSIST_DISPATCH_SIMULATE_RESPONSE';

export const dispatchSimulateResponse = (response: SimulateResponseWrapped) => {
  document.dispatchEvent(
    new CustomEvent(DISPATCH_SIMULATE_RESPONSE, {
      detail: response,
    })
  );
};
