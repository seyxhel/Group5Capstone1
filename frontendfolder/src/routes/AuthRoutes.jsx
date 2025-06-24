import { Routes, Route } from 'react-router-dom';
import SmartSupportLogIn from '../authentication/pages/log-in/SmartSupportLogIn';
import SmartSupportEmployeeCreateAccount from '../authentication/pages/employee-create-account/SmartSupportEmployeeCreateAccount';
import SmartSupportForgotPassword from '../authentication/pages/forgot-password/SmartSupportForgotPassword';

const AuthRoutes = () => (
  <Routes>
    <Route path="/" element={<SmartSupportLogIn />} />
    <Route path="/create-account" element={<SmartSupportEmployeeCreateAccount />} />
    <Route path="/forgot-password" element={<SmartSupportForgotPassword />} />
  </Routes>
);

export default AuthRoutes;
