// Adapter auth service — delegates to either the local or backend service
// and returns a normalized user object so existing components work unchanged.
import { auth as apiAuth, employees as apiEmployees } from '../../services/apiService.js';

const USER_KEY = 'loggedInUser';

const normalizeLocalLogin = (result) => {
  // localAuthService returns { success, data: { access, user, redirect_path } }
  if (!result) return null;
  if (result.success) {
    const user = result.data?.user || null;
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    }
  }
  return null;
};

const authService = {
  // Keep the same call signature used by components: login(email, password)
  login: async (email, password) => {
    try {
      // apiAuth.login may accept (email,password) for local service
      // or a single credentials object for backend service. Adapt accordingly.
      let loginResult;
      if (apiAuth.login.length === 1) {
        // backend-style: login({ email, password })
        loginResult = await apiAuth.login({ email, password });
      } else {
        // local-style: login(email, password)
        loginResult = await apiAuth.login(email, password);
      }

      // If the local service returned the normalized success wrapper
      if (loginResult && typeof loginResult === 'object' && loginResult.success !== undefined) {
        const user = normalizeLocalLogin(loginResult);
        return user;
      }

      // If backend returned tokens (access/refresh), fetch profile
      if (loginResult && (loginResult.access || loginResult.token)) {
        // backendAuthService usually stores tokens itself; now fetch full profile
        try {
          const profile = await apiEmployees.getCurrentEmployee();
          // store a minimal current user for compatibility
          if (profile) {
            localStorage.setItem(USER_KEY, JSON.stringify(profile));
            return profile;
          }
        } catch (err) {
          console.error('Failed to fetch profile after backend login:', err);
          // Fallback: try to decode the JWT access token to get user claims
          try {
            const tokenUser = apiAuth.getCurrentUser();
            if (tokenUser) {
              // The backend token may include extra claims like role/first_name/last_name
              // Merge them into a minimal user object expected by the app
              const minimalUser = {
                id: tokenUser.user_id || tokenUser.id || tokenUser.sub,
                email: tokenUser.email || tokenUser.email || null,
                role: tokenUser.role || null,
                first_name: tokenUser.first_name || tokenUser.given_name || null,
                last_name: tokenUser.last_name || tokenUser.family_name || null,
              };
              localStorage.setItem(USER_KEY, JSON.stringify(minimalUser));
              return minimalUser;
            }
          } catch (e2) {
            console.error('Failed to decode token for fallback user:', e2);
            return null;
          }
        }
      }

      // Unknown response — treat as failure
      return null;
    } catch (error) {
      console.error('AuthService.login error:', error);
      // Surface backend errors to the caller so the UI can show a meaningful message
      throw error;
    }
  },

  logout: async () => {
    try {
      if (apiAuth.logout) await apiAuth.logout();
    } catch (err) {
      console.error('Error during logout:', err);
    }
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser: () => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
};

export default authService;
