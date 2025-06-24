import employeeBonjingData from "../storages/employeeBonjing";
import ticketCoordinatorKenneth from "../storages/ticketCoordinatorKenneth";
import systemAdminMarites from "../storages/systemAdminMarites";

const USER_KEY = "loggedInUser";

const mockUsers = [
  employeeBonjingData,
  ticketCoordinatorKenneth,
  systemAdminMarites,
];

const authService = {
  login: async (email, _password) => {
    // Simulated login (ignores password for now)
    return new Promise((resolve) => {
      setTimeout(() => {
        const matchedUser = mockUsers.find((user) => user.email === email);
        if (matchedUser) {
          localStorage.setItem(USER_KEY, JSON.stringify(matchedUser));
          resolve(matchedUser);
        } else {
          resolve(null);
        }
      }, 800);
    });
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser: () => {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  },
};

export default authService;
