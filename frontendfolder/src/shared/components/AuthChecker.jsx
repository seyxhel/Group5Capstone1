import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../utilities/service/authService';
import { UserProvider } from '../context/UserContext';

const AuthChecker = ({ children }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    user: null,
    hasHDTSAccess: false,
    hdtsRole: null
  });

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check if user is authenticated with the new auth backend
        const user = await authService.checkAuth();
        console.log('🔍 User data received:', user);
        console.log('🔍 User system_roles:', user?.system_roles);
        
        // Debug each system role
        if (user?.system_roles) {
          user.system_roles.forEach((role, index) => {
            console.log(`🔍 System Role ${index}:`, role);
            console.log(`🔍 Role system_slug: "${role.system_slug}"`);
            console.log(`🔍 Role system_name: "${role.system_name}"`);
            console.log(`🔍 Role role_name: "${role.role_name}"`);
          });
        }
        
        // Check if user has HDTS system access
        const hasAccess = authService.hasHDTSAccess(user);
        const role = authService.getHDTSRole(user);
        
        console.log('🔍 Has HDTS Access:', hasAccess);
        console.log('🔍 HDTS Role:', role);

        if (hasAccess) {
          console.log('✅ User has HDTS access, showing dashboard');
          setAuthState({
            loading: false,
            authenticated: true,
            user,
            hasHDTSAccess: true,
            hdtsRole: role
          });
        } else {
          console.log('❌ User authenticated but no HDTS access');
          // User is authenticated but doesn't have HDTS access
          setAuthState({
            loading: false,
            authenticated: true,
            user,
            hasHDTSAccess: false,
            hdtsRole: null
          });
        }
      } catch (error) {
        console.log('❌ Authentication failed, redirecting to login:', error);
        // User is not authenticated, redirect to main auth frontend
        console.log('User not authenticated, redirecting to auth frontend...');
        window.location.href = 'http://localhost:1000/login';
      }
    };

    checkAuthentication();
  }, []);

  if (authState.loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Checking authentication...
      </div>
    );
  }

  if (authState.authenticated && !authState.hasHDTSAccess) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>Access Denied</h2>
        <p>You don't have access to the HDTS Helpdesk System.</p>
        <p>Please contact your administrator to request access.</p>
        <button 
          onClick={() => window.location.href = 'http://localhost:1000/profile'}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Profile
        </button>
      </div>
    );
  }

  // User is authenticated and has HDTS access, wrap with UserProvider
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
};

export default AuthChecker;