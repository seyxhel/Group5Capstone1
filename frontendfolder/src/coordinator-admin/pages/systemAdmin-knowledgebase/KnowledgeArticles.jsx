import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEdit, FaArchive, FaTimes } from 'react-icons/fa';

import styles from './knowledge.module.css';
import Table from '../../../shared/table/Table';
import FilterPanel from '../../../shared/table/FilterPanel';
import SysAdminArticlesFilter from '../../components/filters/SysAdminArticlesFilter';
import DeleteConfirmationModal from '../../components/modals/SysAdminDeleteConfirmationModal';
import ArchiveConfirmationModal from '../../components/modals/SysAdminArchiveConfirmationModal';
import kbService from '../../../services/kbService';
import authService from '../../../utilities/service/authService';

const KnowledgeArticles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, article: null, isDeleting: false });
  const [archiveModal, setArchiveModal] = useState({ isOpen: false, article: null, isArchiving: false });
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
  // fetch categories and articles
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
    openArchiveModal(article);
  };

  const openArchiveModal = (article) => {
    setArchiveModal({ isOpen: true, article, isArchiving: false });
  };

  const closeArchiveModal = () => {
    setArchiveModal({ isOpen: false, article: null, isArchiving: false });
  };

  const confirmArchive = async () => {
    const article = archiveModal.article;
    if (!article) return;

    setArchiveModal((prev) => ({ ...prev, isArchiving: true }));
    try {
      await kbService.updateArticle(article.id, { archived: true });
      window.dispatchEvent(new CustomEvent('kb:articleUpdated', { detail: { id: article.id } }));
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
      closeArchiveModal();
    } catch (err) {
      console.error('Failed to archive article:', err);
      alert('Failed to archive article');
      setArchiveModal((prev) => ({ ...prev, isArchiving: false }));
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
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
      closeDeleteModal();
    } catch (err) {
      console.error('Failed to delete article:', err);
      alert('Failed to delete article');
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // filtered list according to category/visibility/search
  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    const catLabel = appliedFilters?.category?.label || '';
    const visLabel = appliedFilters?.visibility?.label || '';
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
      // visibility filter (case-insensitive)
      if (visLabel) {
        if (((a.visibility || '').toLowerCase()) !== (visLabel || '').toLowerCase()) return false;
      }
      return true;
    });
  }, [articles, appliedFilters, query]);

  // pagination slice
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // Prevent rendering if not authorized
  if (isAuthorized === false) {
    return null;
  }

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

  // small component for counts
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
      key: 'tags',
      label: 'Tags',
      render: (val) => val && val.length ? val.join(', ') : '',
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
      key: 'id',
      label: 'Total Likes',
      render: (val) => <LikesCount articleId={val} />,
    },
    {
      key: 'id',
      label: 'Total Dislikes',
      render: (val) => <DislikesCount articleId={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (val, article) => (
        <>
          <button
            title="View"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            onClick={() => navigate(`/admin/knowledge/view/${article.id}`)}
          >
            <FaEye />
          </button>
          <button
            title="Edit"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            onClick={() => navigate(`/admin/knowledge/edit/${article.id}`)}
          >
            <FaEdit />
          </button>
          <button
            title="Archive"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            onClick={() => handleArchive(article)}
          >
            <FaArchive />
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

  return (
    <>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Article"
        message={`Are you sure you want to delete "${deleteModal.article?.title}"? This article will be permanently removed and cannot be recovered.`}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        isDeleting={deleteModal.isDeleting}
      />

      {/* Archive Confirmation Modal */}
      <ArchiveConfirmationModal
        isOpen={archiveModal.isOpen}
        title="Article"
        message={`Are you sure you want to archive "${archiveModal.article?.title}"? It will be moved to the archived section.`}
        onConfirm={confirmArchive}
        onCancel={closeArchiveModal}
        isArchiving={archiveModal.isArchiving}
      />

      <Table
        variant="default"
        data={filtered
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
        columns={columns}
        title="Knowledge Base Articles"
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
        emptyMessage="No articles found."
      />
    </>
  );
};

export default KnowledgeArticles;
