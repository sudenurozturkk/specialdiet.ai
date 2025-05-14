import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/index.css';
import './styles/custom.css'; // Yeni eklenen style
import './styles/global.css'; // Modern UI için global stiller
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);