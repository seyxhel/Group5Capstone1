import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initializeLocalStorage } from './mock-data/localStorage.js';
import { USE_LOCAL_API } from './config/environment.js';
import { getAllCredentials } from './mock-data/loginCredentials.js';
import './utils/devUtils.js';

// Initialize local storage with mock data if using local API
if (USE_LOCAL_API) {
  console.log('🏠 Initializing local storage for frontend-only development');
  initializeLocalStorage();
  
  // Show available login credentials
  setTimeout(() => {
    console.log('');
    getAllCredentials();
    console.log('');
    console.log('💡 Type "loginCredentials.getAll()" in console to see credentials again');
  }, 1000);
} else {
  console.log("🌐 API_URL:", import.meta.env.VITE_REACT_APP_API_URL);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <App />
  </StrictMode>
);
