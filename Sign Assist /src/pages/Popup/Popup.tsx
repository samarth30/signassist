import React, { useEffect } from 'react';

import Transaction from '../../containers/Transaction/Transaction';

const Popup = () => {
  useEffect(() => {
    document.title = 'Sign Assist';
    chrome.storage.sync.get('first_open', (result) => {
      if (Object.keys(result).length === 0) {
        chrome.storage.sync.set({ first_open: true });
      }
    });
  }, []);

  return (
    <div className="flex flex-row justify-center min-h-[100vh] lg:pb-96">
    <div className="flex flex-col text-white  overflow-hidden min-w-[360px] w-full lg:w-1/5   items-center border border-black" style={{backgroundColor:"#808080"}}>

      <div className="flex flex-row p-5 text-center">
        <h3 className="flex flex-row gap-1 text-xl leading-6 font-medium text-white">
          <div className="font-light text-xl my-auto">Sign Assist</div>
        </h3>
      </div>
      <div className="flex grow">
        <Transaction />
      </div>
      </div>
    </div>
  );
};

export default Popup;
