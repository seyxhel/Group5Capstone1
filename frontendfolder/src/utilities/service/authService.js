import { getEmployeeUsers } from "../storages/employeeUserStorage";

const USER_KEY = "loggedInUser";

const authService = {
  // Keep the same call signature used by components: login(email, password)
  login: async (email, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getEmployeeUsers();
        const matchedUser = users.find(
          (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password
        );

        if (matchedUser) {
          const { password: _, ...userWithoutPassword } = matchedUser;
          localStorage.setItem(USER_KEY, JSON.stringify(userWithoutPassword));
          resolve(userWithoutPassword);
        } else {
          resolve(null);
        }
      }, 500);
    });
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
    try {
      localStorage.removeItem('chatbotMessages');
    } catch (e) {
      // ignore storage errors
    }
  },

  getCurrentUser: () => {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  },

  isAuthenticated: () => {
    return localStorage.getItem(USER_KEY) !== null;
  },

  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user?.role || null;
  },
};

export default authService;
