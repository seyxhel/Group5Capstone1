import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import AuthChecker from './shared/components/AuthChecker';
import RoleBasedRedirect from './shared/components/RoleBasedRedirect';
import EmployeeRoutes from './routes/EmployeeRoutes';
import CoordinatorAdminRoutes from './routes/CoordinatorAdminRoutes';
import ScrollToTop from './shared/ScrollToTop';
import GlobalToast from './shared/toast-notification/GlobalToast';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthChecker>
        <Routes>
          {EmployeeRoutes()}
          {CoordinatorAdminRoutes()}
          {/* Smart redirect based on user's HDTS role */}
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </AuthChecker>
      <GlobalToast />
    </BrowserRouter>
  );
}

export default App;
