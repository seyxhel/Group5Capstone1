import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../../utilities/service/authService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hdtsRole, setHdtsRole] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authService.checkAuth();
        setUser(userData);
        const role = authService.getHDTSRole(userData);
        setHdtsRole(role);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = async () => {
    await authService.logout();
    window.location.href = 'http://localhost:1000/login';
  };

  return (
    <UserContext.Provider value={{
      user,
      hdtsRole,
      loading,
      logout,
      isAdmin: hdtsRole === 'Administrator',
      isAgent: hdtsRole === 'Agent',
      isUser: hdtsRole === 'User'
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;