import logger from './logger';
import { fetchSimulate, ResponseType } from './server';
import type { SimulateRequestArgs } from './simulate_request_reply';
import type { Simulation } from './simulation';

const log = logger.child({ component: 'Storage' });
export enum StoredSimulationState {
  Simulating = 'Simulating',
  Revert = 'Revert',
  Error = 'Error',
  Success = 'Success',
  Rejected = 'Reject',
  Confirmed = 'Confirm',
}

export interface StoredSimulation {
  id: string;
  state: StoredSimulationState;
  simulation?: Simulation;
  error?: string;
}

export const STORAGE_KEY = 'simulations';

export const addSimulation = async (simulation: StoredSimulation) => {
  const { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);
  log.info({ old: simulations, new: simulation }, 'Adding simulation');

  // Add new simulation to the front.
  simulations.push({ ...simulation });

  return chrome.storage.sync.set({ simulations: [simulation] });
};

export const setSimulationNull = async () => {
  return chrome.storage.sync.set({ simulations: [] });
};

const completeSimulation = async (id: string, simulation: Simulation) => {
  const { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);
  log.info({ old: simulations, new: simulation }, 'Completing simulation');
  console.log(simulation, 'simulation');
  simulations.forEach((storedSimulation: StoredSimulation) => {
    if (storedSimulation.id === id) {
      log.debug('Simulation found id', id);
      storedSimulation.state = StoredSimulationState.Success;
      storedSimulation.simulation = simulation;
    }
  });

  return chrome.storage.sync.set({ simulations });
};

const revertSimulation = async (id: string, error?: string) => {
  const { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);
  log.info({ old: simulations, error }, 'Simulation reverted');

  simulations.forEach((storedSimulation: StoredSimulation) => {
    if (storedSimulation.id === id) {
      log.debug('Simulation found id', id);
      storedSimulation.state = StoredSimulationState.Revert;
      storedSimulation.error = error;
    }
  });

  return chrome.storage.sync.set({ simulations });
};

export const removeSimulation = async (id: string) => {
  let { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);
  log.info({ old: simulations, id }, 'Removing simulation');

  simulations = simulations.filter((storedSimulation: StoredSimulation) => {
    return storedSimulation.id !== id;
  });

  return chrome.storage.sync.set({ simulations });
};

export const updateSimulationState = async (
  id: string,
  state: StoredSimulationState
) => {
  let { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);
  log.info({ id, state }, 'Update simulation');

  simulations = simulations.map((x: StoredSimulation) =>
    x.id === id
      ? {
          ...x,
          state,
        }
      : x
  );

  return chrome.storage.sync.set({ simulations });
};

const updateSimulatioWithErrorMsg = async (id: string, error?: string) => {
  let { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);
  log.info({ id, error }, 'Update simulation with error msg');

  simulations = simulations.map((x: StoredSimulation) =>
    x.id === id
      ? {
          ...x,
          error,
          state: StoredSimulationState.Error,
        }
      : x
  );

  return chrome.storage.sync.set({ simulations });
};

export const fetchSimulationAndUpdate = async (
  simulateArgs: SimulateRequestArgs
) => {
  log.info(simulateArgs, 'Fetch simulation and update');
  const [, response] = await Promise.all([
    addSimulation({
      id: simulateArgs.id,
      state: StoredSimulationState.Simulating,
    }),
    fetchSimulate(simulateArgs),
  ]);
  console.log(response, 'simulation');
  if (response.type === ResponseType.Error) {
    log.info(response, 'Response error');
    return updateSimulatioWithErrorMsg(simulateArgs.id, response.error);
  }
  if (response.type === ResponseType.Revert) {
    log.info(response, 'Reverted simulation');
    return revertSimulation(simulateArgs.id, response.error);
  }
  if (response.type === ResponseType.Success) {
    log.info(response, 'Response success');
    if (!response.simulation) {
      throw new Error('Invalid state');
    }
    return completeSimulation(simulateArgs.id, response.simulation);
  }
};

export const clearOldSimulations = async () => {
  let { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);
  log.info(simulations, 'Clear old simulations');

  simulations = simulations.filter(
    (x: StoredSimulation) =>
      x.state !== StoredSimulationState.Rejected &&
      x.state !== StoredSimulationState.Confirmed
  );

  return chrome.storage.sync.set({ simulations });
};

export const simulationNeedsAction = (
  state: StoredSimulationState
): boolean => {
  return (
    state === StoredSimulationState.Success ||
    state === StoredSimulationState.Error ||
    state === StoredSimulationState.Simulating ||
    state === StoredSimulationState.Revert
  );
};
