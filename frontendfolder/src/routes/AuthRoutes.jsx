import { Routes, Route } from 'react-router-dom';
import SmartSupportLogIn from '../authentication/pages/log-in/SmartSupportLogIn';
import SmartSupportEmployeeCreateAccount from '../authentication/pages/employee-create-account/SmartSupportEmployeeCreateAccount';
import SmartSupportForgotPassword from '../authentication/pages/forgot-password/SmartSupportForgotPassword';
import SmartSupportResetPassword from '../authentication/pages/reset-password/SmartSupportResetPassword';
import NotFoundPage from '../shared/not-found-page/NotFoundPage';

const AuthRoutes = () => (
  <Routes>
    <Route path="/" element={<SmartSupportLogIn />} />
    <Route path="/create-account" element={<SmartSupportEmployeeCreateAccount />} />
    <Route path="/forgot-password" element={<SmartSupportForgotPassword />} />
    <Route path="/reset-password/:uidb64/:token" element={<SmartSupportResetPassword />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AuthRoutes;
