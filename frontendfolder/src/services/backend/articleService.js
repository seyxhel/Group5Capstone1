// Backend article service for Knowledge Base
import { API_CONFIG } from '../../config/environment.js';

const BASE_URL = API_CONFIG.BACKEND.BASE_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// Helper to handle 401 errors by logging out immediately
const handleAuthError = (response) => {
  if (response.status === 401) {
    console.log('Session expired (articleService). Dispatching auth:expired event.');
    try {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    } catch (e) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('loggedInUser');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    throw new Error('Session expired. Please log in again.');
  }
};

export const backendArticleService = {
  /**
   * Get all knowledge articles
   */
  async getAllArticles() {
    try {
      const response = await fetch(`${BASE_URL}/api/articles/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      handleAuthError(response);

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
  },

  /**
   * Optional: fetch category choices from backend if the API exposes them.
   * Some backends expose an endpoint like /api/articles/choices/ that returns
   * available category choices. This helper will try that and return [] on failure.
   */
  async getCategoryChoices() {
    try {
      const response = await fetch(`${BASE_URL}/api/articles/choices/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      handleAuthError(response);

      if (!response.ok) return [];

      return await response.json();
    } catch (error) {
      // Not all backends expose this endpoint — that's fine, caller should fallback
      return [];
    }
  },

  /**
   * Get a single article by ID
   */
  async getArticleById(articleId) {
    try {
      const response = await fetch(`${BASE_URL}/api/articles/${articleId}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      handleAuthError(response);

      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  },

  /**
   * Create a new knowledge article
   */
  async createArticle(articleData) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found. Are you logged in?');
      }

      const response = await fetch(`${BASE_URL}/api/articles/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(articleData),
      });

      handleAuthError(response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create article');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  },

  /**
   * Update an existing article (PATCH)
   */
  async updateArticle(articleId, articleData) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${BASE_URL}/api/articles/${articleId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(articleData),
      });

      handleAuthError(response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update article');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  },

  /**
   * Archive an article (custom endpoint)
   */
  async archiveArticle(articleId) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${BASE_URL}/api/articles/${articleId}/archive/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      handleAuthError(response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to archive article');
      }

      return await response.json();
    } catch (error) {
      console.error('Error archiving article:', error);
      throw error;
    }
  },

  /**
   * Restore an archived article (custom endpoint)
   */
  async restoreArticle(articleId) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${BASE_URL}/api/articles/${articleId}/restore/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      handleAuthError(response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to restore article');
      }

      return await response.json();
    } catch (error) {
      console.error('Error restoring article:', error);
      throw error;
    }
  },

  /**
   * Delete an article permanently
   */
  async deleteArticle(articleId) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${BASE_URL}/api/articles/${articleId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      handleAuthError(response);

      if (!response.ok) {
        throw new Error('Failed to delete article');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  },
};
