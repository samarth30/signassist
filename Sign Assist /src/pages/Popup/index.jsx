import React from 'react';
import { render } from 'react-dom';

import Popup from './Popup';
import '../../assets/styles/tailwind.css';
import '../../assets/fonts/hk-grotesk.ttf'

render(<Popup />, window.document.querySelector('#app-container'));

if (module.hot) module.hot.accept();


window.addEventListener(
    'message',
    async (event) => {
        // console.log(event);
        // event.data.data.error.code === 4001
        if (
            event.data &&
            event.data.type && event.data.type === 'FROM_PAGE'
        ) {
            try {
                console.log(event.data);
                if (event.data?.message === 'close') {
                    console.log(event.data?.message);
                }
            } catch (e) {
                console.log(e);
            }
        }
    },
    false
);