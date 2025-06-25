const USER_KEY = "loggedInUser";
const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const authService = {
  // Real admin login
  loginAdmin: async (email, password) => {
    const res = await fetch(`${API_URL}token/admin/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Admin login failed");
    const data = await res.json();
    return data;
  },

  // Real employee login
  loginEmployee: async (email, password) => {
    const response = await fetch(`${API_URL}token/employee/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error("Employee login failed");
    const data = await response.json();
    return data;
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("employee_access_token");
    localStorage.removeItem("employee_refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("employee_first_name");
    localStorage.removeItem("employee_last_name");
    localStorage.removeItem("employee_image");
    localStorage.removeItem("chatbotMessages"); // <-- Add this line
  },

  getCurrentUser: () => {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  },
};

export default authService;
