const USER_KEY = "loggedInUser";
const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const authService = {
  // New unified login using the new auth backend
  login: async (email, password) => {
    const response = await fetch(`${API_URL}users/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important for cookie handling
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error("Login failed");
    const data = await response.json();
    return data;
  },

  // Check current user authentication status
  checkAuth: async () => {
    try {
      const response = await fetch(`${API_URL}users/profile/`, {
        method: "GET",
        credentials: "include", // Include cookies
      });
      if (!response.ok) throw new Error("Not authenticated");
      const userData = await response.json();
      return userData;
    } catch (error) {
      throw new Error("Authentication check failed");
    }
  },

  // Check if user has HDTS system access
  hasHDTSAccess: (user) => {
    if (!user || !user.system_roles) return false;
    return user.system_roles.some(role => role.system_slug === "hdts");
  },

  // Get user's HDTS role
  getHDTSRole: (user) => {
    if (!user || !user.system_roles) return null;
    const hdtsRole = user.system_roles.find(role => role.system_slug === "hdts");
    return hdtsRole ? hdtsRole.role_name : null;
  },

  // Legacy admin login (keeping for backward compatibility)
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

  // Legacy employee login (keeping for backward compatibility)
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

  logout: async () => {
    try {
      await fetch(`${API_URL}users/logout/`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    }
    // Clear all stored data
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("employee_access_token");
    localStorage.removeItem("employee_refresh_token");
    localStorage.removeItem("employee_first_name");
    localStorage.removeItem("employee_last_name");
    localStorage.removeItem("employee_image");
    localStorage.removeItem("chatbotMessages");
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("user_role");
  },

  logoutEmployee: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("employee_access_token");
    localStorage.removeItem("employee_refresh_token");
    localStorage.removeItem("employee_first_name");
    localStorage.removeItem("employee_last_name");
    localStorage.removeItem("employee_image");
    localStorage.removeItem("chatbotMessages");
    // Do NOT remove admin tokens or user_role
  },

  logoutAdmin: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("user_role");
    // Do NOT remove employee tokens or info
  },

  getCurrentUser: () => {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  },
};

export default authService;
