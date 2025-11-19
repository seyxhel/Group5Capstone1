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
  // Try backend first, fallback to in-memory mockCategories
  return backendArticleService.getCategoryChoices()
    .then((choices) => {
      // If backend returns an array of choices, normalize to {id, name}
      // NOTE: some backends expose categories as strings (e.g. 'IT Support').
      // Use the category value itself as `id` so it matches article.category strings.
      if (Array.isArray(choices)) {
        if (choices.length) {
          return choices.map((c, idx) => {
            if (typeof c === 'string') return { id: c, name: c };
            if (c && (c.id || c.name)) return { id: c.id || c.name || idx + 1, name: c.name || c.label || String(c) };
            return { id: String(idx + 1), name: String(c) };
          });
        }
        // Empty array from backend: return it so callers can derive categories from articles
        return [];
      }
      // Not an array: fall back to mock categories
      return Promise.resolve([...mockCategories]);
    })
    .catch(() => Promise.resolve([...mockCategories]));
};

export const listArticles = (filters = {}) => {
  // Try to fetch from backend and apply filters client-side as needed.
  return backendArticleService.getAllArticles()
    .then((articles) => {
      let results = Array.isArray(articles) ? articles.map(a => ({
        id: a.id,
        title: a.title || a.name || a.subject,
        content: a.content || a.body || a.description || '',
        category_id: a.category_id || (a.category && a.category.id) || a.category || null,
        visibility: normalizeVisibility(a.visibility || a.access || a.role || 'Employee'),
        date_created: a.date_created || a.created_at || a.created || new Date().toISOString(),
        date_modified: a.date_modified || a.updated_at || a.updated || new Date().toISOString(),
        archived: !!a.archived || !!a.is_archived || false,
      })) : [...mockArticles];

      if (filters.category_id) results = results.filter(a => a.category_id === filters.category_id || a.categoryId === filters.category_id);
      if (filters.visibility) results = results.filter(a => a.visibility === filters.visibility);
      if (filters.query) {
        const q = filters.query.toLowerCase();
        results = results.filter(a => (a.title || '').toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q));
      }
      return results;
    })
    .catch(() => {
      // Fallback to mock data on error
      let results = [...mockArticles];
      if (filters.category_id) results = results.filter(a => a.category_id === filters.category_id || a.categoryId === filters.category_id);
      if (filters.visibility) results = results.filter(a => a.visibility === filters.visibility);
      if (filters.query) {
        const q = filters.query.toLowerCase();
        results = results.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
      }
      return results;
    });
};

export const getArticle = (id) => {
  return backendArticleService.getArticleById(id)
    .then((a) => {
      if (!a) return null;
      return {
        id: a.id,
        title: a.title || a.name,
        content: a.content || a.body || a.description,
        category_id: a.category_id || (a.category && a.category.id) || a.category,
        visibility: normalizeVisibility(a.visibility || a.access || 'Employee'),
        date_created: a.date_created || a.created_at,
        date_modified: a.date_modified || a.updated_at,
        archived: !!a.archived,
      };
    })
    .catch(() => Promise.resolve(mockArticles.find(a => a.id === Number(id)) || null));
};

export const submitArticle = (article) => {
  // Prefer backend create, fallback to mock
  return backendArticleService.createArticle(article)
    .then(a => ({
      id: a.id,
      title: a.title || a.name,
      content: a.content || a.body || a.description,
      category_id: a.category_id || (a.category && a.category.id) || a.category,
      visibility: normalizeVisibility(a.visibility || a.access || 'Employee'),
      date_created: a.date_created || a.created_at || new Date().toISOString(),
      date_modified: a.date_modified || a.updated_at || new Date().toISOString(),
      archived: !!a.archived,
    }))
    .catch(() => {
      // fallback to in-memory behavior
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
    });
};

export const updateArticle = (id, patch = {}) => {
  // Prefer backend update, fallback to mock
  return backendArticleService.updateArticle(id, patch)
    .then(a => ({
      id: a.id,
      title: a.title || a.name,
      content: a.content || a.body || a.description,
      category_id: a.category_id || (a.category && a.category.id) || a.category,
      visibility: normalizeVisibility(a.visibility || a.access || 'Employee'),
      date_created: a.date_created || a.created_at || new Date().toISOString(),
      date_modified: a.date_modified || a.updated_at || new Date().toISOString(),
      archived: !!a.archived,
    }))
    .catch(() => {
      const idx = mockArticles.findIndex(a => a.id === Number(id));
      if (idx === -1) return Promise.resolve(null);
      const now = new Date().toISOString().slice(0,10);
      mockArticles[idx] = { 
        ...mockArticles[idx], 
        ...patch, 
        date_modified: now,
        dateModified: now
      };
      return Promise.resolve(mockArticles[idx]);
    });
};

export const listPublishedArticles = (filters = {}) => {
  // Use backend when available, fallback to mock. Published = not archived.
  return backendArticleService.getAllArticles()
    .then((articles) => {
      let results = Array.isArray(articles) ? articles.map(a => ({
        id: a.id,
        title: a.title || a.name,
        content: a.content || a.body || a.description,
        category_id: a.category_id || (a.category && a.category.id) || a.category || null,
        visibility: normalizeVisibility(a.visibility || a.access || 'Employee'),
        date_created: a.date_created || a.created_at || new Date().toISOString(),
        date_modified: a.date_modified || a.updated_at || new Date().toISOString(),
        archived: !!a.archived || !!a.is_archived || false,
      })) : [...mockArticles];

      results = results.filter(a => !a.archived);
      if (filters.category_id) results = results.filter(a => a.category_id === filters.category_id || a.categoryId === filters.category_id);
      if (filters.visibility) results = results.filter(a => a.visibility === filters.visibility);
      if (filters.query) {
        const q = filters.query.toLowerCase();
        results = results.filter(a => (a.title || '').toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q));
      }
      return results;
    })
    .catch(() => {
      let results = [...mockArticles].filter(a => !a.archived);
      if (filters.category_id) results = results.filter(a => a.category_id === filters.category_id || a.categoryId === filters.category_id);
      if (filters.visibility) results = results.filter(a => a.visibility === filters.visibility);
      if (filters.query) {
        const q = filters.query.toLowerCase();
        results = results.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
      }
      return results;
    });
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

export const getHistory = (articleId) => {
  return Promise.resolve(mockHistory[Number(articleId)] || []);
};

export const deleteArticle = (id) => {
  return backendArticleService.deleteArticle(id)
    .then(() => Promise.resolve(true))
    .catch(() => {
      const idx = mockArticles.findIndex(a => a.id === Number(id));
      if (idx === -1) return Promise.resolve(false);
      const removed = mockArticles.splice(idx, 1)[0];
      pushHistory(Number(id), 'deleted', { removed }, 'system');
      return Promise.resolve(true);
    });
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
