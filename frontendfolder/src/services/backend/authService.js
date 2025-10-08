// Backend authentication service
import { API_CONFIG } from '../../config/environment.js';

const BASE_URL = API_CONFIG.BACKEND.BASE_URL;

export const backendAuthService = {
  async login(credentials) {
    try {
      const response = await fetch(`${BASE_URL}/api/token/employee/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store authentication tokens
      if (data.access) {
        localStorage.setItem('access_token', data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(userData) {
    try {
      let response;
      // If caller passed a File under userData.profileImage, send multipart FormData
      if (userData && userData.profileImage && userData.profileImage instanceof File) {
        const fd = new FormData();
        // Append simple scalar fields
        for (const [k, v] of Object.entries(userData)) {
          if (k === 'profileImage') continue;
          if (v !== undefined && v !== null) fd.append(k, v);
        }
        fd.append('image', userData.profileImage);

        response = await fetch(`${BASE_URL}/api/create_employee/`, {
          method: 'POST',
          // DO NOT set Content-Type when sending FormData: the browser will set the boundary
          body: fd,
        });
      } else {
        response = await fetch(`${BASE_URL}/api/create_employee/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration error response:', errorData);
        
        // Handle different types of error responses
        if (errorData.email && Array.isArray(errorData.email)) {
          throw new Error(`Email: ${errorData.email[0]}`);
        } else if (errorData.company_id && Array.isArray(errorData.company_id)) {
          throw new Error(`Company ID: ${errorData.company_id[0]}`);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        } else if (errorData.message) {
          throw new Error(errorData.message);
        } else {
          // Handle validation errors from serializer
          const errorMessages = [];
          for (const [field, errors] of Object.entries(errorData)) {
            if (Array.isArray(errors)) {
              errorMessages.push(`${field}: ${errors.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${errors}`);
            }
          }
          throw new Error(errorMessages.join('\n') || 'Registration failed');
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch(`${BASE_URL}/api/employee/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${BASE_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  // Helper method to get current user from token
  getCurrentUser() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.user_id,
        email: payload.email,
        exp: payload.exp
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() < payload.exp * 1000;
    } catch (error) {
      return false;
    }
  }
};