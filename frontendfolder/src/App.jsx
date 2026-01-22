import { BrowserRouter } from 'react-router-dom';
import './App.css';
import AuthRoutes from './routes/AuthRoutes';
import EmployeeRoutes from './routes/EmployeeRoutes';
import CoordinatorAdminRoutes from './routes/CoordinatorAdminRoutes';
import GlobalToast from './shared/toast-notification/GlobalToast';
import NotFoundPage from './shared/not-found-page/NotFoundPage';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <AuthRoutes />
      <EmployeeRoutes />
      <CoordinatorAdminRoutes />
      <Routes>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <GlobalToast />
    </BrowserRouter>
  );
}

export default App;
