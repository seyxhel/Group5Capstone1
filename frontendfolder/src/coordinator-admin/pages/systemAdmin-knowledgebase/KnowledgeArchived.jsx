import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUndo, FaTimes } from 'react-icons/fa';

import styles from './knowledge.module.css';
import Table from '../../../shared/table/Table';
import SysAdminArticlesFilter from '../../components/filters/SysAdminArticlesFilter';
import SysAdminDeleteConfirmationModal from '../../components/modals/SysAdminDeleteConfirmationModal';
import SysAdminRestoreConfirmationModal from '../../components/modals/SysAdminRestoreConfirmationModal';
import kbService from '../../../services/kbService';
import authService from '../../../utilities/service/authService';

const KnowledgeArchived = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, article: null, isDeleting: false });
  const [restoreModal, setRestoreModal] = useState({ isOpen: false, article: null, isRestoring: false });
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Role-based access control - Only System Admin can access
  useEffect(() => {
    const userRole = authService.getUserRole();
    if (userRole !== 'System Admin') {
      setIsAuthorized(false);
      navigate('/admin/dashboard');
    } else {
      setIsAuthorized(true);
    }
  }, [navigate]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [cats, arts] = await Promise.all([kbService.listCategories(), kbService.listArticles({})]);
        const archived = (arts || []).filter(a => a.archived);
        // attach likes/dislikes counts for sorting
        const withCounts = await Promise.all(archived.map(async (a) => {
          try {
            const fb = await kbService.listFeedback(a.id);
            return {
              ...a,
              likesCount: (fb || []).filter(x => x.helpful).length,
              dislikesCount: (fb || []).filter(x => !x.helpful).length,
            };
          } catch (e) {
            return { ...a, likesCount: 0, dislikesCount: 0 };
          }
        }));
        setCategories(cats || []);
        setArticles(withCounts);
      } catch (e) {}
      setLoading(false);
    };
    fetch();
  }, []);

  const getCategoryName = (id) => {
    const c = categories.find(x => String(x.id) === String(id));
    return c ? c.name : 'Uncategorized';
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

  const openDeleteModal = (article) => {
    setDeleteModal({ isOpen: true, article, isDeleting: false });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, article: null, isDeleting: false });
  };

  const confirmDelete = async () => {
    const article = deleteModal.article;
    if (!article) return;

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await kbService.updateArticle(article.id, { deleted: true });
      window.dispatchEvent(new CustomEvent('kb:articleUpdated', { detail: { id: article.id } }));
      setArticles(prev => prev.filter(p => p.id !== article.id));
      closeDeleteModal();
    } catch (err) {
      console.error('Failed to delete article:', err);
      alert('Failed to delete article');
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const openRestoreModal = (article) => {
    setRestoreModal({ isOpen: true, article, isRestoring: false });
  };

  const closeRestoreModal = () => {
    setRestoreModal({ isOpen: false, article: null, isRestoring: false });
  };

  const confirmRestore = async () => {
    const article = restoreModal.article;
    if (!article) return;

    setRestoreModal((prev) => ({ ...prev, isRestoring: true }));
    try {
      await kbService.updateArticle(article.id, { archived: false });
      window.dispatchEvent(new CustomEvent('kb:articleUpdated', { detail: { id: article.id } }));
      setArticles(prev => prev.filter(p => p.id !== article.id));
      closeRestoreModal();
    } catch (err) {
      console.error('Failed to restore article:', err);
      alert('Failed to restore article');
      setRestoreModal((prev) => ({ ...prev, isRestoring: false }));
    }
  };
  

  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    const start = appliedFilters?.startDate || '';
    const end = appliedFilters?.endDate || '';
    const catLabel = appliedFilters?.category?.label || '';
    const visLabel = appliedFilters?.visibility?.label || '';
    const startTs = start ? new Date(start).setHours(0,0,0,0) : null;
    const endTs = end ? new Date(end).setHours(23,59,59,999) : null;

    const result = (articles || []).filter(a => {
      if (catLabel) {
        const name = getCategoryName(a.category_id);
        if (name !== catLabel) return false;
      }

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

      if (visLabel) {
        if (((a.visibility || '').toLowerCase()) !== (visLabel || '').toLowerCase()) return false;
      }
      return true;
    });

    // Apply sorting if provided by the filter panel
    const sortVal = appliedFilters?.sort?.value;
    if (sortVal === 'likes_desc') {
      result.sort((x, y) => (y.likesCount || 0) - (x.likesCount || 0));
    } else if (sortVal === 'dislikes_desc') {
      result.sort((x, y) => (y.dislikesCount || 0) - (x.dislikesCount || 0));
    } else if (sortVal === 'date_desc') {
      result.sort((x, y) => new Date(y.date_modified || y.date_created).getTime() - new Date(x.date_modified || x.date_created).getTime());
    }

    return result;
  }, [articles, appliedFilters, categories, query]);

  const FilterComponent = () => (
    <SysAdminArticlesFilter
      key={showFilter ? "filter-shown" : "filter-hidden"}
      hideToggleButton={true}
      initialShow={showFilter}
      onApply={(filters) => {
        setAppliedFilters(filters);
        setCurrentPage(1);
      }}
      onReset={(filters) => {
        setAppliedFilters(filters);
        setCurrentPage(1);
      }}
      initialFilters={appliedFilters}
      categoryOptions={(categories || []).map(c => ({ label: c.name }))}
    />
  );

  const columns = [
    {
      key: 'title',
      label: 'Article',
      render: (val, article) => (
        <div>
          <div style={{ fontWeight: 500 }}>{val}</div>
          <div style={{ fontSize: '0.85em', color: '#666' }}>{article.author} • {formatArticleDate(article)}</div>
        </div>
      ),
    },
    {
      key: 'category_id',
      label: 'Category',
      render: (val) => getCategoryName(val),
    },
    {
      key: 'visibility',
      label: 'Visibility',
      render: (val) => val,
    },
    {
      key: 'id',
      label: 'Created',
      render: (val, article) => formatArticleDate(article),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (val, article) => (
        <>
          <button
            title="Restore"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            onClick={() => openRestoreModal(article)}
          >
            <FaUndo />
          </button>
          <button
            title="Delete"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            onClick={() => openDeleteModal(article)}
          >
            <FaTimes />
          </button>
        </>
      ),
    },
  ];

  // Prevent rendering if not authorized
  if (isAuthorized === false) {
    return null;
  }

  return (
    <>
      {/* Delete Confirmation Modal */}
      <SysAdminDeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Article"
        message={`Are you sure you want to delete "${deleteModal.article?.title}"? This article will be permanently removed and cannot be recovered.`}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        isDeleting={deleteModal.isDeleting}
      />

      {/* Restore Confirmation Modal */}
      <SysAdminRestoreConfirmationModal
        isOpen={restoreModal.isOpen}
        title="Article"
        message={`Restore "${restoreModal.article?.title}"? This will move the article back to active articles.`}
        onConfirm={confirmRestore}
        onCancel={closeRestoreModal}
        isRestoring={restoreModal.isRestoring}
      />

      <Table
        variant="default"
        data={filtered
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
        columns={columns}
        title="Archived Articles"
        searchable
        searchValue={query}
        onSearchChange={(q) => {
          setQuery(q);
          setCurrentPage(1);
        }}
        filterComponent={FilterComponent}
        showFilter={showFilter}
        onShowFilterChange={setShowFilter}
        currentPage={currentPage}
        pageSize={itemsPerPage}
        totalItems={filtered.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
        isLoading={loading}
        emptyMessage="No archived articles found."
      />
    </>
  );
};

export default KnowledgeArchived;
