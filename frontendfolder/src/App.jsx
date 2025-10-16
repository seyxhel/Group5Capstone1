import { BrowserRouter } from 'react-router-dom';
import './App.css';
import AuthRoutes from './routes/AuthRoutes';
import EmployeeRoutes from './routes/EmployeeRoutes';
import CoordinatorAdminRoutes from './routes/CoordinatorAdminRoutes';
import GlobalToast from './shared/toast-notification/GlobalToast';

function App() {
  return (
    <BrowserRouter>
      <AuthRoutes />
      <EmployeeRoutes />
      <CoordinatorAdminRoutes />
      <GlobalToast />
    </BrowserRouter>
  );
}

export default App;
