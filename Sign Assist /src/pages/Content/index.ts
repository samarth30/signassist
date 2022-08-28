import logger from '../../lib/logger';
import {
  RequestManager,
  SimulateRequestArgs,
} from '../../lib/simulate_request_reply';
import {
  listenToSimulateRequest,
  dispatchSimulateResponse,
  SIMULATE_REQUEST_COMMAND,
  SimulateResponse,
} from '../../lib/simulate_request_reply';
import { setSimulationNull, StoredSimulation } from '../../lib/storage';
import { removeSimulation, StoredSimulationState } from '../../lib/storage';

const log = logger.child({ component: 'Content-Script' });
console.log('Content Script Loaded');

let ids: string[] = [];

const maybeRemoveId = (id: string) => {
  log.debug('Maybe removing id', id);
  if (ids.includes(id)) {
    log.debug('RemovingId', id);
    ids = ids.filter((thisId) => thisId !== id);
    removeSimulation(id);
  }
};

listenToSimulateRequest((simulateRequest: SimulateRequestArgs) => {
  log.info({ simulateRequest }, 'SimulateRequest');
  ids.push(simulateRequest.id);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.simulations?.newValue) {
      const newSimulations = changes.simulations.newValue;
      log.info(newSimulations, 'Dispatching new values for simulation');

      newSimulations.forEach((simulation: StoredSimulation) => {
        if (simulation.state === StoredSimulationState.Confirmed) {
          log.debug('Dispatch confirmed', simulation.id);
          dispatchSimulateResponse({
            id: simulation.id,
            type: SimulateResponse.Continue,
          });
          maybeRemoveId(simulation.id);
        } else if (simulation.state === StoredSimulationState.Rejected) {
          log.debug('Dispatch rejected', simulation.id);
          dispatchSimulateResponse({
            id: simulation.id,
            type: SimulateResponse.Reject,
          });
          maybeRemoveId(simulation.id);
        }
      });
    }
  });

  chrome.runtime.sendMessage({
    command: SIMULATE_REQUEST_COMMAND,
    data: simulateRequest,
  });
});

// /// Handling all the request communication.
const REQUEST_MANAGER = new RequestManager();

let chainIdEventId = 0,
  CHAIN_ID: string;

function eventListener() {
  window.addEventListener(
    'message',
    async (event: any) => {
      // console.log(event);
      // event.data.data.error.code === 4001
      if (
        event.data &&
        window.location.origin === 'https://roboxminting.netlify.app'
        // &&
        // event?.data?.name?.includes('metamask')
        // (event.data?.data?.data?.method === 'eth_sendTransaction' ||
        //   event.data?.data?.data?.method === 'eth_signTypedData_v4')
      ) {
        try {
          // console.log(CHAIN_ID);
          if (!CHAIN_ID) {
            if (
              chainIdEventId !== 0 &&
              event.data?.data?.data?.id === chainIdEventId
            ) {
              CHAIN_ID = event.data?.data?.data?.result;
            }

            if (event.data?.data?.data?.method === 'eth_chainId') {
              chainIdEventId = event.data?.data?.data?.id;
            }
          }

          if (event.data?.data?.data?.method === 'metamask_chainChanged') {
            CHAIN_ID = event.data?.data?.data?.params['chainId'];
          }

          if (event.data?.data?.data?.method === 'eth_sendTransaction') {
            console.log(event.data?.data?.data);
            // console.log(event.data?.data?.data?.params);
            setSimulationNull();
            const response = REQUEST_MANAGER.request({
              chainId: CHAIN_ID.toString(),
              website: window.location.origin,
              transaction: event.data?.data?.data?.params[0],
            });
          }

          // if (event.data?.data?.data?.method === 'eth_signTypedData_v4') {
          //   // console.log(event.data?.data?.data);
          //   // console.log(event.data?.data?.data?.params);
          // }
        } catch (e) {
          console.log(e);
        }
      }
    },
    false
  );
}

eventListener();
