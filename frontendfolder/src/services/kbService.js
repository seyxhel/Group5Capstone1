// Knowledge Base Service - Backend Adapter
// This adapts the backend article API to match the expected kbService interface
import { backendArticleService } from './backend/articleService';
import { TICKET_CATEGORIES } from '../shared/constants/ticketCategories';

// Helper to capitalize visibility string
const capitalizeVisibility = (visibility) => {
  const map = {
    'employee': 'Employee',
    'ticket coordinator': 'Ticket Coordinator',
    'system admin': 'System Admin'
  };
  return map[visibility.toLowerCase()] || 'Employee';
};

// Helper to normalize visibility from backend
const normalizeVisibility = (v) => {
  if (!v) return v;
  const s = String(v).trim().toLowerCase();
  if (s === 'system admin' || s === 'system_admin' || s === 'admin') return 'System Admin';
  if (s === 'ticket coordinator' || s === 'coordinator' || s === 'ticket_coordinator') return 'Ticket Coordinator';
  if (s === 'employee' || s === 'staff' || s === 'everyone') return 'Employee';
  return v.replace(/\b\w/g, c => c.toUpperCase());
};

export const listCategories = async () => {
  // Return categories in the format expected by the UI
  return TICKET_CATEGORIES.map((name, index) => ({
    id: index + 1,
    name: name
  }));
};

export const listArticles = async (filters = {}) => {
  try {
    const articles = await backendArticleService.getAllArticles();
    
    // Map backend article format to UI format
    return articles.map(article => ({
      id: article.id,
      title: article.subject,
      content: article.description,
      category_id: TICKET_CATEGORIES.indexOf(article.category) + 1,
      visibility: normalizeVisibility(article.visibility),
      author: article.created_by_name || 'Unknown',
      date_created: article.created_at,
      date_modified: article.updated_at,
      archived: article.is_archived
    }));
  } catch (error) {
    console.error('Failed to list articles:', error);
    return [];
  }
};

export const getArticle = async (id) => {
  try {
    const article = await backendArticleService.getArticleById(id);
    
    return {
      id: article.id,
      title: article.subject,
      content: article.description,
      category_id: TICKET_CATEGORIES.indexOf(article.category) + 1,
      visibility: article.visibility.toLowerCase(),
      author: article.created_by_name || 'Unknown',
      date_created: article.created_at,
      date_modified: article.updated_at,
      archived: article.is_archived
    };
  } catch (error) {
    console.error('Failed to get article:', error);
    throw error;
  }
};

export const submitArticle = async (data) => {
  try {
    // Map UI format to backend format
    const backendData = {
      subject: data.title,
      description: data.content,
      category: TICKET_CATEGORIES[(data.category_id || 1) - 1] || 'Others',
      visibility: capitalizeVisibility(data.visibility || 'employee')
    };
    
    const article = await backendArticleService.createArticle(backendData);
    
    return {
      id: article.id,
      title: article.subject,
      content: article.description,
      category_id: TICKET_CATEGORIES.indexOf(article.category) + 1,
      visibility: normalizeVisibility(article.visibility),
      author: article.created_by_name || 'Unknown',
      date_created: article.created_at,
      date_modified: article.updated_at,
      archived: article.is_archived
    };
  } catch (error) {
    console.error('Failed to submit article:', error);
    throw error;
  }
};

export const updateArticle = async (id, data) => {
  try {
    // Handle both UI format updates and direct property updates (like { archived: true })
    if (data.archived !== undefined || data.deleted !== undefined) {
      // Special case for archive/delete operations
      if (data.archived) {
        await backendArticleService.archiveArticle(id);
      } else if (data.archived === false) {
        await backendArticleService.restoreArticle(id);
      }
      
      // Fetch the updated article
      const article = await backendArticleService.getArticleById(id);
      return {
        id: article.id,
        title: article.subject,
        content: article.description,
        category_id: TICKET_CATEGORIES.indexOf(article.category) + 1,
        visibility: normalizeVisibility(article.visibility),
        author: article.created_by_name || 'Unknown',
        date_created: article.created_at,
        date_modified: article.updated_at,
        archived: article.is_archived
      };
    } else {
      // Regular update
      const backendData = {};
      if (data.title) backendData.subject = data.title;
      if (data.content) backendData.description = data.content;
      if (data.category_id) backendData.category = TICKET_CATEGORIES[data.category_id - 1] || 'Others';
      if (data.visibility) backendData.visibility = capitalizeVisibility(data.visibility);
      
      const article = await backendArticleService.updateArticle(id, backendData);
      
      return {
        id: article.id,
        title: article.subject,
        content: article.description,
        category_id: TICKET_CATEGORIES.indexOf(article.category) + 1,
        visibility: normalizeVisibility(article.visibility),
        author: article.created_by_name || 'Unknown',
        date_created: article.created_at,
        date_modified: article.updated_at,
        archived: article.is_archived
      };
    }
  } catch (error) {
    console.error('Failed to update article:', error);
    throw error;
  }
};

export const listPublishedArticles = async (filters = {}) => {
  // For now, same as listArticles
  return listArticles(filters);
};

export const listFeedback = async (articleId) => {
  // Stub for now - returns empty array (not implemented in backend yet)
  return [];
};

export const submitFeedback = async ({ articleId, helpful, comment }) => {
  // Stub for now - not implemented in backend yet
  console.warn('submitFeedback not implemented in backend yet');
  return { id: Date.now(), articleId, helpful, comment, date: new Date().toISOString() };
};

export const deleteArticle = async (id) => {
  try {
    await backendArticleService.deleteArticle(id);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete article:', error);
    throw error;
  }
};

export const resetSeeds = () => {
  // No-op for backend service
  console.warn('resetSeeds is not applicable for backend service');
};

// default export includes main conveniences for imports that use default
export default {
  listCategories,
  listArticles,
  listPublishedArticles,
  getArticle,
  submitArticle,
  updateArticle,
  listFeedback,
  submitFeedback,
  deleteArticle,
  resetSeeds,
};
