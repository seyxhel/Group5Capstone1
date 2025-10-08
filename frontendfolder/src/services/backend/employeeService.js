// Backend employee service
import { API_CONFIG } from '../../config/environment.js';

const BASE_URL = API_CONFIG.BACKEND.BASE_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  const headers = {};
  // Only set JSON content-type when sending JSON body
  headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const backendEmployeeService = {
  async getAllEmployees() {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  async getEmployeeById(employeeId) {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/${employeeId}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employee');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  },

  async getCurrentEmployee() {
    try {
      const response = await fetch(`${BASE_URL}/api/employee/profile/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch current employee');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching current employee:', error);
      throw error;
    }
  },

  async verifyCurrentPassword(currentPassword) {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${BASE_URL}/api/employee/verify-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ current_password: currentPassword }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying current password:', error);
      throw error;
    }
  },

  async updateEmployee(employeeId, employeeData) {
    try {
      let response = await fetch(`${BASE_URL}/api/employees/${employeeId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(employeeData),
      });

      // If the route doesn't exist (404) some deployments don't expose /api/employees/:id/
      // so fall back to updating the current authenticated user at /api/employee/profile/
      if (response.status === 404) {
        response = await fetch(`${BASE_URL}/api/employee/profile/`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify(employeeData),
        });
      }

      if (!response.ok) {
        // When parsing error body, use separate clones to avoid reading the same stream twice
        if (response.status === 401) {
          // Unauthorized - likely missing/expired token
          try {
            const errJson = await response.clone().json();
            throw new Error(errJson.detail || errJson.message || 'Unauthorized');
          } catch (_) {
            const txt = await response.clone().text();
            throw new Error(txt || 'Unauthorized');
          }
        }

        try {
          const errorData = await response.clone().json();
          throw new Error(errorData.message || errorData.detail || 'Failed to update employee');
        } catch (_) {
          const text = await response.clone().text();
          throw new Error(text || response.statusText || 'Failed to update employee');
        }
      }

      // Successful response
      try {
        return await response.json();
      } catch (parseErr) {
        // If server returned no JSON body but succeeded, return an empty object
        return {};
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  async createEmployee(employeeData) {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create employee');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  async deleteEmployee(employeeId) {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/${employeeId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },

  async getEmployeesByDepartment(department) {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/?department=${department}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees by department');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employees by department:', error);
      throw error;
    }
  },

  async updateEmployeeStatus(employeeId, status) {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/${employeeId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update employee status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating employee status:', error);
      throw error;
    }
  },

  async uploadEmployeeImage(employeeId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const token = localStorage.getItem('access_token');
      // Backend endpoint expects authenticated user and does not require an employeeId in the path
      const response = await fetch(`${BASE_URL}/api/employee/upload-image/`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      if (!response.ok) {
        const clone = response.clone();
        try {
          const err = await clone.json();
          throw new Error(err.message || err.detail || 'Failed to upload image');
        } catch (_) {
          const txt = await clone.text();
          throw new Error(txt || 'Failed to upload image');
        }
      }

      try {
        return await response.json();
      } catch (_) {
        return {};
      }
    } catch (error) {
      console.error('Error uploading employee image:', error);
      throw error;
    }
  },

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${BASE_URL}/api/employee/change-password/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      return await response.json();
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
};