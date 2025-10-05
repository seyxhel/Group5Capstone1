import { Outlet } from "react-router-dom";

const ProtectedRoute = ({ role }) => {
  // Since AuthChecker already handles authentication and HDTS access,
  // ProtectedRoute can simply allow access for authenticated users
  console.log('ProtectedRoute: Allowing access since AuthChecker already verified HDTS access');
  return <Outlet />;
};

export default ProtectedRoute;