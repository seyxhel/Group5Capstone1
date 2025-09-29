// Local authentication service that replaces backend API calls
import { 
  STORAGE_KEYS, 
  getFromStorage, 
  setToStorage, 
  removeFromStorage 
} from '../../mock-data/localStorage.js';

// Simulate API delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const localAuthService = {
  // Login function
  login: async (email, password) => {
    await delay();
    
    const employees = getFromStorage(STORAGE_KEYS.EMPLOYEES) || [];
    const admins = getFromStorage(STORAGE_KEYS.ADMINS) || [];
    const allUsers = [...employees, ...admins];
    
    // Find user by email (in real app, password would be hashed and verified)
    const user = allUsers.find(u => u.email === email);
    
    if (user && user.status === 'approved') {
      // Generate mock JWT token
      const token = btoa(JSON.stringify({
        user_id: user.id,
        email: user.email,
        role: user.role,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }));
      
      // Store token and user data
      setToStorage(STORAGE_KEYS.AUTH_TOKEN, token);
      setToStorage(STORAGE_KEYS.CURRENT_USER, user);
      
      return {
        success: true,
        data: {
          access: token,
          user: user
        }
      };
    } else if (user && user.status === 'pending') {
      return {
        success: false,
        error: 'Account is pending approval'
      };
    } else {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
  },

  // Register function
  register: async (userData) => {
    await delay();
    
    const employees = getFromStorage(STORAGE_KEYS.EMPLOYEES) || [];
    
    // Check if email already exists
    const existingUser = employees.find(u => u.email === userData.email);
    if (existingUser) {
      return {
        success: false,
        error: 'Email already exists'
      };
    }
    
    // Check if company_id already exists
    const existingCompanyId = employees.find(u => u.company_id === userData.company_id);
    if (existingCompanyId) {
      return {
        success: false,
        error: 'Company ID already exists'
      };
    }
    
    // Create new user
    const newUser = {
      id: Math.max(0, ...employees.map(e => e.id)) + 1,
      ...userData,
      status: 'pending',
      date_joined: new Date().toISOString(),
      profile_image: '/public/default-profile.png'
    };
    
    // Add to employees array
    employees.push(newUser);
    setToStorage(STORAGE_KEYS.EMPLOYEES, employees);
    
    return {
      success: true,
      message: 'Account created successfully. Awaiting approval.'
    };
  },

  // Logout function
  logout: async () => {
    await delay(100);
    removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
    removeFromStorage(STORAGE_KEYS.CURRENT_USER);
    return { success: true };
  },

  // Get current user
  getCurrentUser: () => {
    const token = getFromStorage(STORAGE_KEYS.AUTH_TOKEN);
    const user = getFromStorage(STORAGE_KEYS.CURRENT_USER);
    
    if (token && user) {
      try {
        const tokenData = JSON.parse(atob(token));
        if (tokenData.exp > Date.now()) {
          return user;
        }
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
    
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return localAuthService.getCurrentUser() !== null;
  },

  // Forgot password
  forgotPassword: async (email) => {
    await delay();
    
    const employees = getFromStorage(STORAGE_KEYS.EMPLOYEES) || [];
    const user = employees.find(u => u.email === email);
    
    if (user) {
      // In real app, this would send an email
      console.log(`Password reset email sent to ${email}`);
      return {
        success: true,
        message: 'Password reset instructions sent to your email'
      };
    } else {
      return {
        success: false,
        error: 'Email not found'
      };
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    await delay();
    // In a real app, you'd verify the token and update the password
    return {
      success: true,
      message: 'Password reset successfully'
    };
  }
};
