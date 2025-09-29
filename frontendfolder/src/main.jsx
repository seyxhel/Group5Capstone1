import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initializeLocalStorage } from './mock-data/localStorage.js';
import { USE_LOCAL_API } from './config/environment.js';
import './utils/devUtils.js';

// Initialize local storage with mock data if using local API
if (USE_LOCAL_API) {
  console.log('🏠 Initializing local storage for frontend-only development');
  initializeLocalStorage();
} else {
  console.log("🌐 API_URL:", import.meta.env.VITE_REACT_APP_API_URL);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <App />
  </StrictMode>
);
