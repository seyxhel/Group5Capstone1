import { USE_LOCAL_API } from '../../config/environment.js';
import { localAuthService } from '../../services/local/authService.js';

const USER_KEY = "loggedInUser";
const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const authService = {
  // Admin login (local or backend)
  loginAdmin: async (email, password) => {
    if (USE_LOCAL_API) {
      console.log('🔓 Using local authentication for admin login');
      return await localAuthService.login(email, password);
    }
    
    // Backend API login
    const res = await fetch(`${API_URL}token/admin/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Admin login failed");
    const data = await res.json();
    return data;
  },

  // Employee login (local or backend)
  loginEmployee: async (email, password) => {
    if (USE_LOCAL_API) {
      console.log('🔓 Using local authentication for employee login');
      return await localAuthService.login(email, password);
    }
    
    // Backend API login
    const response = await fetch(`${API_URL}token/employee/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error("Employee login failed");
    const data = await response.json();
    return data;
  },

  logoutEmployee: () => {
    if (USE_LOCAL_API) {
      console.log('🔓 Local logout for employee');
      localStorage.removeItem("hdts_current_user");
      return;
    }
    
    // Backend logout
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
    if (USE_LOCAL_API) {
      console.log('🔓 Local logout for admin');
      localStorage.removeItem("hdts_current_user");
      return;
    }
    
    // Backend logout
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("user_role");
    // Do NOT remove employee tokens or info
  },

  getCurrentUser: () => {
    if (USE_LOCAL_API) {
      return localAuthService.getCurrentUser();
    }
    
    // Backend getCurrentUser
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  },
};

export default authService;
