import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { SpeechProvider } from "@speechly/react-client";

const appId = "527ee381-493e-4a0e-b00d-0b91b63fe6b6";

ReactDOM.render(
  <SpeechProvider appId={appId}>
    <App />
  </SpeechProvider>,
  document.getElementById('root')
);
