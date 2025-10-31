import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AuthExpiredModal from './shared/components/AuthExpiredModal';
import { AuthProvider } from './context/AuthContext.jsx'

const Root = () => {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const handler = () => setExpired(true);
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  useEffect(() => {
    const appEl = document.getElementById('app-root');
    if (!appEl) return;
    if (expired) appEl.classList.add('aem-blur');
    else appEl.classList.remove('aem-blur');
  }, [expired]);

  return (
    <>
      <div id="app-root">
        <App />
      </div>
      <AuthExpiredModal open={expired} onClose={() => {
        // Clear auth state then redirect when user confirms
        try { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); } catch(e) {}
        try { localStorage.removeItem('admin_access_token'); localStorage.removeItem('employee_access_token'); } catch(e) {}
        try { localStorage.removeItem('admin_refresh_token'); localStorage.removeItem('employee_refresh_token'); } catch(e) {}
        try { localStorage.removeItem('user'); localStorage.removeItem('loggedInUser'); } catch(e) {}
        setExpired(false);
        window.location.href = '/';
      }} />
    </>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <AuthProvider>
        <Root />    
      </AuthProvider>
  </StrictMode>
);
