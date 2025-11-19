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

// --- In-memory seeds & mocks (used by the mock kb service) ---
// These provide a minimal dataset so the service functions can operate
// without an external dependency during development.
const categoriesSeed = [
  { id: 1, name: 'IT Support' },
  { id: 2, name: 'Asset Check In' },
  { id: 3, name: 'Asset Check Out' },
];

const articlesSeed = [
  {
    id: 1001,
    title: 'How to reset your password',
    content: 'Step-by-step instructions to reset your password.',
    category_id: 1,
    visibility: 'Employee',
    date_created: new Date().toISOString(),
    date_modified: new Date().toISOString(),
    archived: false,
  },
  {
    id: 1002,
    title: 'Asset checkout procedure',
    content: 'How to properly check out company assets.',
    category_id: 3,
    visibility: 'Ticket Coordinator',
    date_created: new Date().toISOString(),
    date_modified: new Date().toISOString(),
    archived: false,
  }
];

const feedbackSeed = [
  { id: 1, articleId: 1001, helpful: true, comment: 'Very useful', date: new Date().toISOString() }
];

// Live in-memory collections
let mockCategories = JSON.parse(JSON.stringify(categoriesSeed));
let mockArticles = JSON.parse(JSON.stringify(articlesSeed)).map(a => ({ ...a, visibility: normalizeVisibility(a.visibility) }));
let mockFeedback = JSON.parse(JSON.stringify(feedbackSeed));

// Simple history store keyed by article id
const mockHistory = {}; // { [articleId]: [ { action, timestamp, by, changes } ] }

const pushHistory = (articleId, action, changes = {}, by = 'system') => {
  const entry = { action, timestamp: new Date().toISOString(), by, changes };
  mockHistory[articleId] = mockHistory[articleId] || [];
  mockHistory[articleId].push(entry);
};

export const listCategories = () => {
  // Return a Promise to match async usage in UI (e.g. .then)
  return Promise.resolve([...mockCategories]);
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
  return Promise.resolve(results);
};

export const getArticle = (id) => {
  // Return a Promise so callers using .then or await behave consistently
  return Promise.resolve(mockArticles.find(a => a.id === Number(id)) || null);
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
  return Promise.resolve(newArticle);
};

export const updateArticle = (id, patch = {}) => {
  const idx = mockArticles.findIndex(a => a.id === Number(id));
  if (idx === -1) return null;
  const now = new Date().toISOString().slice(0,10);
  const before = { ...mockArticles[idx] };
  mockArticles[idx] = { 
    ...mockArticles[idx], 
    ...patch, 
    date_modified: now,
    dateModified: now
  };
  return Promise.resolve(mockArticles[idx]);
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
  return Promise.resolve(results);
};

export const resetSeeds = () => {
  mockCategories = JSON.parse(JSON.stringify(categoriesSeed));
  mockArticles = JSON.parse(JSON.stringify(articlesSeed)).map(a => ({ ...a, visibility: normalizeVisibility(a.visibility) }));
  mockFeedback = JSON.parse(JSON.stringify(feedbackSeed));
};

export const listFeedback = (articleId) => {
  // Return a Promise to match async usage in UI (e.g. .then)
  return Promise.resolve(mockFeedback.filter(f => f.articleId === Number(articleId)));
};

export const submitFeedback = ({ articleId, helpful, comment }) => {
  const id = mockFeedback.length ? Math.max(...mockFeedback.map(f => f.id)) + 1 : 1;
  const entry = { id, articleId: Number(articleId), helpful: !!helpful, comment: comment || '', date: new Date().toISOString() };
  mockFeedback.push(entry);
  return Promise.resolve(entry);
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
