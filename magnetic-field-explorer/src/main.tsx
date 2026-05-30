import React from 'react';
import ReactDOM from 'react-dom/client';
import * as tf from '@tensorflow/tfjs';
import './i18n/index';
import App from './App';
import useStore from './store/useStore';
import './index.css';

async function main(): Promise<void> {
  await tf.ready();
  useStore.getState().setTfBackend(tf.getBackend());

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void main();
