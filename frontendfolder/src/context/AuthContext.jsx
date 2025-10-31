// src/api/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";

const AuthContext = createContext();
const AUTH_URL = import.meta.env.VITE_AUTH_URL || "";
const PROFILE_URL = `${AUTH_URL}/api/v1/users/profile/`;
const LOGIN_URL = `${AUTH_URL}/api/v1/token/obtain/`;
const LOGOUT_URL = `${AUTH_URL}/api/v1/token/logout/`; // optional

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);


  // ✅ Keep axios instance stable with useMemo
  const api = useMemo(() => {
    return axios.create({
      baseURL: AUTH_URL,
      headers: { "Content-Type": "application/json" },
      withCredentials: true, // crucial for cookie-based auth
    });
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get(PROFILE_URL);
      if (response.status === 200) {
        localStorage.setItem("user", JSON.stringify(response.data));
        setUser(response.data);
      }
    } catch (error) {
      console.warn("User not authenticated or session expired:", error);
      clearAuth();
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [api, clearAuth]);

  // 🔁 Always check session on mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const login = async (email, password) => {
    try {
      const response = await api.post(LOGIN_URL, { email, password });
      if (response.status === 200) {
        // Cookie set by server, just fetch profile
        await fetchUserProfile();
        return { success: true };
      }
      return { success: false, error: "Invalid login response" };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Login failed",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post(LOGOUT_URL);
    } catch (e) {
      console.warn("Logout endpoint not available:", e);
    }
    clearAuth();
    window.location.href = "/login";
  };

  // --- HasSystemAccess is the access to the system (i.e. agent access)
  // --- isAdmin checks the designated Admin role for the system (i.e. responsible for the admin functionalities)
  // --- if a much more nuanced role system is needed, this logic can be expanded,

  // Check if user has Admin role for HDTS
  const isAdmin = useMemo(() => {
    if (!user || !Array.isArray(user.system_roles)) return false;
  
    return user.system_roles.some(
      (r) =>
        r.system_slug === "hdts" &&
        r.role_name === "Admin"
    );
  }, [user]);
  
  // this code checks slug for whatever system is needed
  const hasSystemAccess = useMemo(() => {
    if (!user || !Array.isArray(user.system_roles)) return false;
  
    return user.system_roles.some(
      (r) => r.system_slug === "hdts"
    );
  }, [user]);


  // ✅ Memoize the context value
  const value = useMemo(
    () => ({
      user,
      setUser,
      login,
      logout,
      isAdmin,
      hasSystemAccess,
      loading,
      initialized,
      hasAuth: !!user,
    }),
    [user, loading, isAdmin, hasSystemAccess]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
