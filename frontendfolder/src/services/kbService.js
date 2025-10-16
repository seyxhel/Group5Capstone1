// Lightweight mock service for Knowledgebase frontend (seeded)
import categoriesSeed from '../mocks/seed/categories.json';
import articlesSeed from '../mocks/seed/articles.json';
import feedbackSeed from '../mocks/seed/feedback.json';

let mockCategories = JSON.parse(JSON.stringify(categoriesSeed));
let mockArticles = JSON.parse(JSON.stringify(articlesSeed));
let mockFeedback = JSON.parse(JSON.stringify(feedbackSeed));

// Normalize visibility labels in mockArticles to canonical forms
const normalizeVisibility = (v) => {
  if (!v) return v;
  const s = String(v).trim().toLowerCase();
  if (s === 'system admin' || s === 'system_admin' || s === 'admin') return 'System Admin';
  if (s === 'ticket coordinator' || s === 'coordinator' || s === 'ticket_coordinator') return 'Ticket Coordinator';
  if (s === 'employee' || s === 'staff' || s === 'everyone') return 'Employee';
  return v.replace(/\b\w/g, c => c.toUpperCase());
};

mockArticles = mockArticles.map(a => ({ ...a, visibility: normalizeVisibility(a.visibility) }));

export const listCategories = async () => {
  // simulate async
  return new Promise((res) => setTimeout(() => res([...mockCategories]), 120));
};

export const listArticles = async (filters = {}) => {
  // filters: { category_id, query, visibility }
  return new Promise((res) => {
    setTimeout(() => {
      let results = [...mockArticles];
      if (filters.category_id) results = results.filter(a => a.category_id === filters.category_id);
      if (filters.visibility) results = results.filter(a => a.visibility === filters.visibility);
      if (filters.query) {
        const q = filters.query.toLowerCase();
        results = results.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
      }
      res(results);
    }, 150);
  });
};

export const getArticle = async (id) => {
  return new Promise((res) => setTimeout(() => res(mockArticles.find(a => a.id === Number(id)) || null), 100));
};

export const submitArticle = async (article) => {
  // naive push
  const id = mockArticles.length ? Math.max(...mockArticles.map(a => a.id)) + 1 : 1001;
  const newArticle = { id, ...article };
  mockArticles.push(newArticle);
  return new Promise((res) => setTimeout(() => res(newArticle), 150));
};

export const updateArticle = async (id, patch = {}) => {
  const idx = mockArticles.findIndex(a => a.id === Number(id));
  if (idx === -1) return null;
  mockArticles[idx] = { ...mockArticles[idx], ...patch, date_modified: new Date().toISOString().slice(0,10) };
  return new Promise((res) => setTimeout(() => res(mockArticles[idx]), 120));
};

export const listPublishedArticles = async (filters = {}) => {
  // With status removed, 'published' articles are the ones visible according to visibility rules.
  return new Promise((res) => {
    setTimeout(() => {
      let results = [...mockArticles];
      if (filters.category_id) results = results.filter(a => a.category_id === filters.category_id);
      if (filters.visibility) results = results.filter(a => a.visibility === filters.visibility);
      if (filters.query) {
        const q = filters.query.toLowerCase();
        results = results.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
      }
      res(results);
    }, 120);
  });
};

export const resetSeeds = () => {
  mockCategories = JSON.parse(JSON.stringify(categoriesSeed));
  mockArticles = JSON.parse(JSON.stringify(articlesSeed));
  mockFeedback = JSON.parse(JSON.stringify(feedbackSeed));
};

export const listFeedback = async (articleId) => {
  return new Promise((res) => setTimeout(() => res(mockFeedback.filter(f => f.articleId === Number(articleId))), 120));
};

export const submitFeedback = async ({ articleId, helpful, comment }) => {
  const id = mockFeedback.length ? Math.max(...mockFeedback.map(f => f.id)) + 1 : 1;
  const entry = { id, articleId: Number(articleId), helpful: !!helpful, comment: comment || '', date: new Date().toISOString() };
  mockFeedback.push(entry);
  return new Promise((res) => setTimeout(() => res(entry), 120));
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
  resetSeeds,
};
