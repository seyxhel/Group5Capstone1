import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEdit, FaArchive, FaTimes } from 'react-icons/fa';

import userStyles from '../user-management/CoordinatorAdminUserAccess.module.css';
import TablePagination from '../../../shared/table/TablePagination';
import Button from '../../../shared/components/Button';
import FilterPanel from '../../../shared/table/FilterPanel';
import fpStyles from '../../../shared/table/FilterPanel.module.css';
import kbService from '../../../services/kbService';
import authService from '../../../utilities/service/authService';

const KnowledgeArticles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({});

  // appliedFilters is the source of truth for FilterPanel initial state

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetch = async () => {
    setLoading(true);
    try {
      const [cats, arts] = await Promise.all([kbService.listCategories(), kbService.listArticles({})]);
      setCategories(cats || []);
      setArticles((arts || []).filter(a => !a.archived));
    } catch (e) {
      // swallow for now
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const onCreated = () => fetch();
    window.addEventListener('kb:articleCreated', onCreated);
    window.addEventListener('kb:articleUpdated', onCreated);
    return () => {
      window.removeEventListener('kb:articleCreated', onCreated);
      window.removeEventListener('kb:articleUpdated', onCreated);
    };
  }, []);

  const getCategoryName = (id) => {
    const c = categories.find(x => String(x.id) === String(id));
    return c ? c.name : 'Uncategorized';
  };

  const normalizeAuthorLabel = (author) => {
    if (!author) return '';
    const s = String(author).toLowerCase();
    if (s.includes('system admin') || s.includes('system administrator') || s.includes('administrator')) return 'System Admin';
    return author;
  };

  const truncate = (text, max = 29) => {
    if (!text) return '';
    const str = String(text);
    if (str.length <= max) return str;
    // show max chars = max (including dots). keep max-3 characters then '...'
    return str.slice(0, Math.max(0, max - 3)) + '...';
  };

  const formatArticleDate = (a) => {
    const dateStr = a.date_created || a.date_modified || '';
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  const handleArchive = async (article) => {
    if (!window.confirm(`Archive "${article.title}"?`)) return;
    await kbService.updateArticle(article.id, { archived: true });
    window.dispatchEvent(new CustomEvent('kb:articleUpdated', { detail: { id: article.id } }));
    fetch();
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Delete "${article.title}" permanently? This cannot be undone.`)) return;
    try {
      await kbService.deleteArticle(article.id);
      window.dispatchEvent(new CustomEvent('kb:articleDeleted', { detail: { id: article.id } }));
      fetch();
    } catch (error) {
      alert('Failed to delete article. Please try again.');
    }
  };

  // filtered list according to category/visibility/search
  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    const catLabel = appliedFilters?.category?.label || '';
    const statusLabel = appliedFilters?.status?.label || '';
    const start = appliedFilters?.startDate || '';
    const end = appliedFilters?.endDate || '';

    const startTs = start ? new Date(start).setHours(0,0,0,0) : null;
    const endTs = end ? new Date(end).setHours(23,59,59,999) : null;

    return articles.filter(a => {
      // category filter (compare by category name)
      if (catLabel) {
        const name = getCategoryName(a.category_id);
        if (name !== catLabel) return false;
      }

      // date range filter - use date_modified or date_created
      if (startTs || endTs) {
        const dateStr = a.date_modified || a.date_created || '';
        const artTs = dateStr ? new Date(dateStr).getTime() : null;
        if (startTs && artTs !== null && artTs < startTs) return false;
        if (endTs && artTs !== null && artTs > endTs) return false;
      }

      if (q) {
        const hay = ((a.title || '') + ' ' + (a.content || '')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // visibility/status filter (case-insensitive)
      if (statusLabel) {
        if (((a.visibility || '').toLowerCase()) !== (statusLabel || '').toLowerCase()) return false;
      }
      return true;
    });
  }, [articles, appliedFilters, query]);

  // pagination slice
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // small components for counts (kept simple)
  const LikesCount = ({ articleId }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let mounted = true;
      kbService.listFeedback(articleId).then((f) => {
        if (!mounted) return;
        setCount((f || []).filter(x => x.helpful).length);
      }).catch(()=>{});
      return () => { mounted = false; };
    }, [articleId]);
    return <span>{count}</span>;
  };

  const DislikesCount = ({ articleId }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let mounted = true;
      kbService.listFeedback(articleId).then((f) => {
        if (!mounted) return;
        setCount((f || []).filter(x => !x.helpful).length);
      }).catch(()=>{});
      return () => { mounted = false; };
    }, [articleId]);
    return <span>{count}</span>;
  };

  return (
    <div className={userStyles.pageContainer}>
      {/* Filter panel (outside the table) — use shared FilterPanel for consistent spacing */}
      <FilterPanel
        onApply={(filters) => { setAppliedFilters(filters); setCurrentPage(1); }}
        onReset={(filters) => { setAppliedFilters(filters); setCurrentPage(1); }}
        initialFilters={appliedFilters}
        categoryFirst={true}
        categoryLabel="Category"
        showDateFilters={true}
  // use the status dropdown to represent Visibility for KB
  statusLabel="Visibility"
  statusOptions={[{ label: 'Employee' }, { label: 'Ticket Coordinator' }, { label: 'System Admin' }]}
        showStatus={true}
        priorityOptions={[]}
        subCategoryOptions={[]}
        categoryOptions={(categories || []).map(c => ({ label: c.name }))}
      />

      <div className={userStyles.tableSection}>
        <div className={userStyles.tableHeader}>
          <h2>Articles</h2>
            <div className={userStyles.tableActions}>
            <input
              className={userStyles.searchBar}
              type="search"
              placeholder="Search..."
              value={query}
              onChange={e => { setQuery(e.target.value); setCurrentPage(1); }}
            />
            {authService.getUserRole() !== 'Ticket Coordinator' && (
              <button
                className={userStyles.registerButton}
                onClick={() => navigate('/admin/knowledge/create')}
              >
                Create Article
              </button>
            )}
          </div>
        </div>

        {/* Filter is rendered above the table — duplicates removed */}

        <div className={userStyles.tableWrapper}>
          <table className={userStyles.table}>
            <thead>
              <tr>
                <th style={{ width: 260 }}>Article</th>
                <th>Category</th>
                <th style={{ width: 120, textAlign: 'center' }}>Visibility</th>
                <th style={{ width: 140, textAlign: 'center' }}>Created</th>
                <th style={{ width: 140, textAlign: 'center' }}>Total Likes</th>
                <th style={{ width: 160, textAlign: 'center' }}>Total Dislikes</th>
                <th style={{ width: 180, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#6b7280', fontStyle: 'italic' }}>
                    {loading ? 'Loading…' : 'No articles found for this category or search.'}
                  </td>
                </tr>
              ) : (
                paginated.map((a, idx) => (
                  <tr key={a.id || idx}>
                    <td>
                      <div className={userStyles.subjectCell} title={a.title}>
                        <div style={{ fontWeight: 600 }}>{truncate(a.title, 29)}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{normalizeAuthorLabel(a.author)} • {formatArticleDate(a)}</div>
                      </div>
                    </td>
                    <td>{getCategoryName(a.category_id)}</td>
              <td style={{ textAlign: 'center' }}>{a.visibility}</td>
              <td style={{ textAlign: 'center' }}>{formatArticleDate(a)}</td>
                    <td style={{ textAlign: 'center' }}><LikesCount articleId={a.id} /></td>
                    <td style={{ textAlign: 'center' }}><DislikesCount articleId={a.id} /></td>
                    <td>
                      <div className={userStyles.actionButtonCont}>
                        <button title="View" className={userStyles.actionButton} onClick={() => window.alert(a.content)}>
                          <FaEye />
                        </button>
                        <button title="Edit" className={userStyles.actionButton} onClick={() => navigate(`/admin/knowledge/create?edit=${a.id}`)}>
                          <FaEdit />
                        </button>
                        <button title="Archive" className={userStyles.actionButton} onClick={() => handleArchive(a)}>
                          <FaArchive />
                        </button>
                        <button title="Delete" className={userStyles.actionButton} onClick={() => handleDelete(a)}>
                          <FaTimes />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={userStyles.tablePagination}>
          <TablePagination
            currentPage={currentPage}
            totalItems={filtered.length}
            initialItemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            alwaysShow={true}
          />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeArticles;
