import React from 'react';
import ReactDOM from 'react-dom/client';
import * as tf from '@tensorflow/tfjs';
import './i18n/index.js';
import App from './App.jsx';
import useStore from './store/useStore.js';
import './index.css';

async function main() {
  // Initialize TensorFlow.js backend
  await tf.ready();
  useStore.getState().setTfBackend(tf.getBackend());

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

main();
