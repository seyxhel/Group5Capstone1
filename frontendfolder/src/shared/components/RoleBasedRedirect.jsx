import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const RoleBasedRedirect = () => {
  const { hdtsRole, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect based on HDTS role
  switch (hdtsRole) {
    case 'Employee':
      return <Navigate to="/employee/home" replace />;
    default:
      // Show access denied for any role that's not Employee
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Access Denied</h2>
          <p>Only Employee role can access the HDTS system.</p>
          <p>Your current role: {hdtsRole || 'No HDTS role assigned'}</p>
          <a href="http://localhost:1000/home">Back to Profile</a>
        </div>
      );
  }
};

export default RoleBasedRedirect;