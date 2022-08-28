import logger from '../../lib/logger';
import type { SimulateRequestArgs } from '../../lib/simulate_request_reply';
import { SIMULATE_REQUEST_COMMAND } from '../../lib/simulate_request_reply';
import type { StoredSimulation } from '../../lib/storage';
import {
  fetchSimulationAndUpdate,
  clearOldSimulations,
  simulationNeedsAction,
} from '../../lib/storage';

const log = logger.child({ component: 'Background' });

log.info('Background initialized');

let currentPopup: undefined | number;

chrome.windows.onRemoved.addListener(
  (windowId: number) => {
    log.info(windowId, 'Removing popup');
    if (currentPopup && currentPopup === windowId) {
      currentPopup = undefined;
    }
  },
  {
    windowTypes: ['popup'],
  }
);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.simulations?.newValue) {
    const oldSimulations = changes.simulations.oldValue;
    const newSimulations = changes.simulations.newValue;

    const oldFiltered = oldSimulations?.filter(
      (storedSimulation: StoredSimulation) => {
        return simulationNeedsAction(storedSimulation.state);
      }
    );
    const newFiltered = newSimulations.filter(
      (storedSimulation: StoredSimulation) => {
        return simulationNeedsAction(storedSimulation.state);
      }
    );

    log.debug(
      {
        currentPopup,
        oldSimulations,
        newSimulations,
        oldFiltered,
        newFiltered,
      },
      'New storage values'
    );

    if (
      !currentPopup &&
      (!oldFiltered || newFiltered.length > oldFiltered.length)
    ) {
      currentPopup = -1;

      log.info('Creating popup.');

      setTimeout(() => {
        chrome.windows.create(
          {
            url: 'popup.html',
            type: 'popup',
            width: 360,
            height: 640,
          },
          (createdWindow) => {
            log.info(createdWindow?.id, 'Assigning popup to id');
            currentPopup = createdWindow?.id;
          }
        );
      }, 1500);

      return;
    }

    if (
      newFiltered.length === 0 &&
      oldFiltered.length === 1 &&
      currentPopup &&
      currentPopup !== -1
    ) {
      const closeId = currentPopup;
      log.info(closeId, 'Trying to remove popup');
      currentPopup = undefined;
      chrome.windows.remove(closeId);

      return;
    }

    if (currentPopup && currentPopup !== -1) {
      log.info('Focusing popup.');
      chrome.windows.update(currentPopup, {
        focused: true,
      });
    }
  }
  // });
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.command === SIMULATE_REQUEST_COMMAND) {
    log.info(request, 'Simulate request command');

    const args: SimulateRequestArgs = request.data;
    clearOldSimulations().then(() => fetchSimulationAndUpdate(args));
  } else {
    log.warn('Unknown command', request);
  }
  // });
});
