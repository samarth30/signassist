import { utils, BigNumber } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useChromeStorageSync } from 'use-chrome-storage';
import type { Event } from '../../lib/simulation';
import { Simulation, EventType, TokenType } from '../../lib/simulation';
import type { StoredSimulation } from '../../lib/storage';
import { Audio } from 'react-loader-spinner'
import {
  STORAGE_KEY,
  simulationNeedsAction,
  StoredSimulationState,
  updateSimulationState,
} from '../../lib/storage';
import { Network, Alchemy } from "alchemy-sdk";

// Optional Config object, but defaults to   demo api-key and eth-mainnet.
const settings = {
  apiKey: "288bM9URpbOb3BpYup0YyNxjdEouX9y6", // Replace with your Alchemy API Key.
  network: Network.MATIC_MAINNET, // Replace with your network.
};

const alchemy = new Alchemy(settings);

const NoTransactionComponent = () => {
  return (
    // TODO Simple Page Image if no transaction
    <div className="text-lg text-center p-5">
      <img className="m-auto w-24" src="transparentbg.png" alt="" />
      <div className="p-2 text-gray-100">
        Trigger a transaction to get started.
      </div>
    </div>
  );
};

/**
 * Pass in a hex string, get out the parsed amount.
 *
 * If the amount is undefined or null, the return will be 1.
 */
const getFormattedAmount = (
  amount: string | null,
  decimals: number | null
): string => {
  if (!amount) {
    return '1';
  }

  if (!decimals) {
    decimals = 0;
  }

  if (amount === '0x') {
    return '0';
  }

  const amountParsed = BigNumber.from(amount.toString());

  // We're okay to round here a little bit since we're just formatting.
  const amountAsFloatEther = parseFloat(
    utils.formatUnits(amountParsed, decimals)
  );

  let formattedAmount;

  if (amountAsFloatEther > 1 && amountAsFloatEther % 1 !== 0) {
    // Add 4 decimals if it is > 1
    formattedAmount = amountAsFloatEther.toFixed(4);
  } else {
    // Add precision of 4.
    formattedAmount = amountAsFloatEther.toLocaleString('fullwide', {
      useGrouping: false,
      maximumSignificantDigits: 4,
    });
  }

  return formattedAmount;
};

const EventComponent =  ({ event }: { event: Event }) => {


  const formattedAmount = getFormattedAmount(
    // @ts-ignore
    event.amount === true || event.amount === false ? null : event.amount,
    event.decimals ? event.decimals : null
  );

  const [imagefromalchemy , setimagefromalchemy] = useState("");

  useEffect(() => { 
    const fetchNfts = async ()=>{
      
        const a = await  alchemy.nft.getNftMetadata(
          // @ts-ignore
        "0x1871464f087db27823cff66aa88599aa4815ae95",
        "1543124",
        )
        console.log("hello", event.contract_address?.toString(),
        event.amount)
        console.log(a);
        // @ts-ignore
        event.image = a?.media[0]?.gateway
        console.log(a?.media[0]?.gateway)
        setimagefromalchemy(a?.media[0]?.gateway)
    }
     fetchNfts();
  }, [])
  
  // 
  

  const message = () => {
    if (
      event.function_name === "Transfer"
    ) {

      return (
        <div
          className={`text-red-600 bg-mylightred  rounded-xl p-2 `}
        >
          { '-'}

          1 NFT

        </div>
      );
    }else {
      return null
    }
  };

  return (
    <div className="flex justify-between gap-x-2 relative p-2 bg-white">
      <div className="flex gap-x-2 mr-10">
        <img
          className="m-auto"
          src={ imagefromalchemy || event.image || 'unknown.png'}
          alt="token"
          width="48"
          height="48"
        />
        <div className="text-xs text-mygray m-auto min-w-auto">
          {event.name || 'Unknown Name'}
          {event.tokenType === TokenType.ERC721 ?
            //  @ts-ignore
            !event.amount ? null : <div className="mt-0"> {event.amount !== true && event?.amount?.length <= 6 &&  `# ${formattedAmount}`  }</div> : null}
        </div>
      </div>
      <div className='min-w-auto mr-3 text-base text-right ml-auto my-auto'>
        {message()}
      </div>
    </div>
  );
};


const SimulationComponent = ({ simulation }: { simulation: Simulation }) => {

  const simulationEvents = () => {
    if (simulation.events.length === 0) {
      return (
        <div className="flex flex-col p-1 gap-4 text-center text-xl w-full">
          No changes in assets found!
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 w-full">
        you bought this nft for 2 matic 5 hours ago
        {simulation.events.map((event: any, index: number) => {
          return <EventComponent key={`${index}`} event={event} />;
          // return <div>hello</div>
        })}
      </div>
    );
  };

  return <div className="self-start w-full">{simulationEvents()}</div>;
};

const ConfirmSimulationButton = ({
  id,
  state,
  seconds
}: {
  id: string;
  state: StoredSimulationState;
  seconds :Number
}) => {
  if (simulationNeedsAction(state)) {
    let okButtonClassName = "bg-gray-500";
    if (state !== StoredSimulationState.Simulating || seconds === 4) {
      okButtonClassName = "bg-white hover:bg-blue-100";
    }
    console.log(seconds)
    return (
      <div className="flex flex-row space-x-16 p-4 justify-center">
        <button
          className={`${okButtonClassName} text-base text-black w-28 py-2 rounded-full`}
          onClick={() => {
            updateSimulationState(id, StoredSimulationState.Rejected);
          }}
          disabled={state !== StoredSimulationState.Simulating || seconds === 4 ? false : true}
        >
          OK
        </button>
      
      </div>
    );
  }
  return null;
};

// todo change loader in code
const StoredSimulationComponent = ({
  storedSimulation,
  seconds
}: {
  storedSimulation: StoredSimulation;
  seconds: Number
}) => {

   

  if (storedSimulation.state === StoredSimulationState.Simulating) {
    return (
      <div className="flex flex-col grow justify-center items-center w-full">
        <div className="flex flex-col justify-center items-center">
          <Audio color="#00BFFF" height={80} width={80}/>
          Simulating...
        </div>
      </div>
    );
  }

  if (storedSimulation.state === StoredSimulationState.Revert) {
   

    return (
      // TODO Failed image
      <div className="flex flex-col grow justify-center items-center w-11/12">
        <img className="w-48" src="transparentbg.png" alt="failed" />
        <div className="text-gray-300 text-center text-base p-2">
          <div>
            Simulation shows the transaction will fail
            {storedSimulation.error &&
              ` with message ${JSON.stringify(
                storedSimulation.error,
                null,
                2
              )}.`}
          </div>
        </div>
      </div>
    );
  }

  if (storedSimulation.state === StoredSimulationState.Error) {
    

    return (
      // TODO Transaction Errored image
      <div className="flex flex-col grow justify-center items-center w-11/12">
        <img className="w-32" src="transparentbg.png" alt="failure" />
        <div className="text-gray-300 text-center text-base p-2">
          <div>
            Simulation faced some issue{' '}
            {storedSimulation.error &&
              `with message ${JSON.stringify(
                storedSimulation.error,
                null,
                2
              )}.`}
          </div>
        </div>
      </div>
    );
  }

  // Re-hydrate the functions.
  const simulation = Simulation.fromJSON(storedSimulation.simulation);

  if (storedSimulation.state === StoredSimulationState.Success) {
    return (
      <div className="flex flex-col grow items-center justify-center w-full">
       
        <div className="flex flex-col grow items-center justify-center w-full">
          <div className="m-2 border-y border-gray-600 w-full">
            <SimulationComponent simulation={simulation} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const TransactionComponent = () => {
  const [storedSimulations] = useChromeStorageSync(STORAGE_KEY, []);



  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    let myInterval = setInterval(() => {
      
      setSeconds(seconds + 1);
    }, 1000)
    return () => {
      clearInterval(myInterval);
    };
  });

  const filteredSimulations = storedSimulations?.filter(
    (simulation: StoredSimulation) =>
      simulation.state !== StoredSimulationState.Rejected &&
      simulation.state !== StoredSimulationState.Confirmed
  );

  if (!filteredSimulations || filteredSimulations.length === 0) {
    return (
      <div className="flex flex-col">
        <div>
          <img
            className="w-screen border-t border-gray-600"
            // src="waves_top.png "
            alt=""
          />
        </div>
        <div className="flex grow justify-center items-center">
          <NoTransactionComponent />
        </div>
        <div>
          <img className="mt-auto w-screen"
            //  src="waves_bottom.png" 
            alt="" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between w-full">
      {filteredSimulations.length !== 1 && (
        <div className="p-2 text-base flex items-center justify-center text-gray-400 border-t border-gray-600 w-full">
          {filteredSimulations.length} transactions queued
        </div>
      )}
      
      <div className="flex flex-col grow w-full justify-center items-center">
        <StoredSimulationComponent
          key={filteredSimulations[0].id}
          storedSimulation={filteredSimulations[0]}
          seconds={seconds}
        />
        <img
          className="mt-auto w-screen"
          // src="waves_bottom.png"
          alt=""
        />
        <div className="mt-auto border-t border-gray-600 w-full">
          <ConfirmSimulationButton
            id={filteredSimulations[0].id}
            state={filteredSimulations[0].state}
            seconds={seconds}
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionComponent;
