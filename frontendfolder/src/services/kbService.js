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

export const listCategories = () => {
  // Return synchronously for mock data
  return [...mockCategories];
};

export const listArticles = (filters = {}) => {
  // filters: { category_id, query, visibility }
  let results = [...mockArticles];
  if (filters.category_id) results = results.filter(a => a.category_id === filters.category_id || a.categoryId === filters.category_id);
  if (filters.visibility) results = results.filter(a => a.visibility === filters.visibility);
  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
  }
  return results;
};

export const getArticle = (id) => {
  return mockArticles.find(a => a.id === Number(id)) || null;
};

export const submitArticle = (article) => {
  // naive push
  const id = mockArticles.length ? Math.max(...mockArticles.map(a => a.id)) + 1 : 1001;
  const now = new Date().toISOString().slice(0,10);
  const newArticle = { 
    id, 
    ...article, 
    date_created: now,
    dateCreated: now,
    date_modified: now,
    dateModified: now,
    archived: false
  };
  mockArticles.push(newArticle);
  return newArticle;
};

export const updateArticle = (id, patch = {}) => {
  const idx = mockArticles.findIndex(a => a.id === Number(id));
  if (idx === -1) return null;
  const now = new Date().toISOString().slice(0,10);
  mockArticles[idx] = { 
    ...mockArticles[idx], 
    ...patch, 
    date_modified: now,
    dateModified: now
  };
  return mockArticles[idx];
};

export const listPublishedArticles = (filters = {}) => {
  // With status removed, 'published' articles are the ones visible according to visibility rules.
  let results = [...mockArticles].filter(a => !a.archived);
  if (filters.category_id) results = results.filter(a => a.category_id === filters.category_id || a.categoryId === filters.category_id);
  if (filters.visibility) results = results.filter(a => a.visibility === filters.visibility);
  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
  }
  return results;
};

export const resetSeeds = () => {
  mockCategories = JSON.parse(JSON.stringify(categoriesSeed));
  mockArticles = JSON.parse(JSON.stringify(articlesSeed)).map(a => ({ ...a, visibility: normalizeVisibility(a.visibility) }));
  mockFeedback = JSON.parse(JSON.stringify(feedbackSeed));
};

export const listFeedback = (articleId) => {
  return mockFeedback.filter(f => f.articleId === Number(articleId));
};

export const submitFeedback = ({ articleId, helpful, comment }) => {
  const id = mockFeedback.length ? Math.max(...mockFeedback.map(f => f.id)) + 1 : 1;
  const entry = { id, articleId: Number(articleId), helpful: !!helpful, comment: comment || '', date: new Date().toISOString() };
  mockFeedback.push(entry);
  return entry;
};

// default export includes main conveniences for imports that use default
export default {
  listCategories,
  listArticles,
  listPublishedArticles,
  getArticle,
  submitArticle,
  updateArticle,
  getHistory,
  listFeedback,
  submitFeedback,
  deleteArticle,
  resetSeeds,
};
