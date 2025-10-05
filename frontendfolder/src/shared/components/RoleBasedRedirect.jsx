import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const RoleBasedRedirect = () => {
  const { hdtsRole, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect based on HDTS role
  switch (hdtsRole) {
    case 'System Administrator':
      return <Navigate to="/admin/dashboard" replace />;
    case 'Ticket Coordinator':
      return <Navigate to="/admin/dashboard" replace />; // You can change this later if coordinators have different dashboard
    case 'Employee':
    default:
      return <Navigate to="/employee/home" replace />;
  }
};

export default RoleBasedRedirect;