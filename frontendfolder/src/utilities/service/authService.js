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
  login: async (email, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const matchedUser = mockUsers.find(
          (user) => user.email === email && user.password === password
        );

        if (matchedUser) {
          const { password, ...userWithoutPassword } = matchedUser;
          localStorage.setItem(USER_KEY, JSON.stringify(userWithoutPassword));
          resolve(userWithoutPassword);
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
