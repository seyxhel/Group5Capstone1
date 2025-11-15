import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaArchive } from 'react-icons/fa';
import styles from '../../../employee/pages/ticket-tracker/EmployeeTicketTracker.module.css';
import detailStyles from '../ticket-tracker/CoordinatorAdminTicketDetails.module.css';
import localStyles from './KnowledgeArticleView.module.css';
import ViewCard from '../../../shared/components/ViewCard';
import Loading from '../../../shared/components/Loading/Loading';
import Button from '../../../shared/components/Button';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import Tabs from '../../../shared/components/Tabs';
import DeleteConfirmationModal from '../../components/modals/SysAdminDeleteConfirmationModal';
import ArchiveConfirmationModal from '../../components/modals/SysAdminArchiveConfirmationModal';
import kbService from '../../../services/kbService';
import authService from '../../../utilities/service/authService';

const KnowledgeArticleView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, isDeleting: false });
  const [archiveModal, setArchiveModal] = useState({ isOpen: false, isArchiving: false });
  const [runtimeError, setRuntimeError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // Sync column heights - matching ticket tracker pattern exactly
  useEffect(() => {
    console.debug('[KB] KnowledgeArticleView mounted for id', id);
    const onErrorEvent = (event) => {
      try {
        const e = event?.error || event?.message || String(event);
        console.error('[KB] Unhandled error event in KnowledgeArticleView', e);
        setRuntimeError(e?.stack || e?.toString?.() || String(e));
      } catch (err) {
        console.error(err);
      }
    };
    const onWindowError = (msg, url, line, col, err) => {
      console.error('[KB] window.onerror caught in KnowledgeArticleView', err || msg);
      setRuntimeError(err?.stack || String(msg));
      return false;
    };
    window.addEventListener('error', onErrorEvent);
    window.onerror = onWindowError;
    let rAF = null;
    let resizeTimer = null;
    let imgs = [];
    let imgLoadHandlers = [];
    let observer = null;

    const sync = () => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        const left = leftColRef.current;
        const right = rightColRef.current;
        if (!left || !right) return;
        left.style.minHeight = '';
        right.style.minHeight = '';
        const leftH = left.getBoundingClientRect().height;
        const rightH = right.getBoundingClientRect().height;
        const maxH = Math.max(leftH, rightH);
        left.style.minHeight = `${maxH}px`;
        right.style.minHeight = `${maxH}px`;
      });
    };

    sync();
    const lateTimer = setTimeout(sync, 220);

    // Watch images inside columns so when they load we re-sync
    const watchImages = () => {
      imgs = [];
      imgLoadHandlers = [];
      const left = leftColRef.current;
      const right = rightColRef.current;
      if (!left || !right) return;
      const nodeImgs = [...left.querySelectorAll('img'), ...right.querySelectorAll('img')];
      nodeImgs.forEach((img) => {
        if (img.complete) return;
        const h = () => sync();
        img.addEventListener('load', h);
        img.addEventListener('error', h);
        imgs.push(img);
        imgLoadHandlers.push({ img, h });
      });
    };

    watchImages();

    // MutationObserver to detect dynamic content changes
    try {
      observer = new MutationObserver(() => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(sync, 120);
      });
      if (leftColRef.current) observer.observe(leftColRef.current, { childList: true, subtree: true });
      if (rightColRef.current) observer.observe(rightColRef.current, { childList: true, subtree: true });
    } catch (err) {
      // ignore if MutationObserver not available
    }

    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(sync, 120);
    };

    window.addEventListener('resize', onResize);

    return () => {
      if (rAF) cancelAnimationFrame(rAF);
      if (resizeTimer) clearTimeout(resizeTimer);
      clearTimeout(lateTimer);
      imgLoadHandlers.forEach(({ img, h }) => {
        try { img.removeEventListener('load', h); img.removeEventListener('error', h); } catch(e) {}
      });
      if (observer) {
        try { observer.disconnect(); } catch (e) {}
      }
      window.removeEventListener('resize', onResize);
      if (leftColRef.current) leftColRef.current.style.minHeight = '';
      if (rightColRef.current) rightColRef.current.style.minHeight = '';
    };
  }, [id, article, activeTab]);

  // cleanup runtime handlers on unmount
  useEffect(() => {
    return () => {
      try {
        window.onerror = null;
      } catch (e) {}
    };
  }, []);

  // Load article on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (kbService.getArticle) {
          const fetchedArticle = kbService.getArticle(id);
          setArticle(fetchedArticle);

          // Enforce system-admin-only visibility: kbService normalizes visibility to title case.
          // If the article is "System Admin" only, prevent non-System Admin users from viewing it.
          try {
            const isAdminOnly = fetchedArticle?.visibility === 'System Admin';
            const currentRole = authService.getUserRole();
            if (isAdminOnly && currentRole !== 'System Admin') {
              setUnauthorized(true);
            } else {
              setUnauthorized(false);
            }
          } catch (e) {
            // if anything goes wrong, default to not unauthorized
            setUnauthorized(false);
          }

          // Load category
          if (fetchedArticle && kbService.listCategories) {
            const categories = kbService.listCategories();
            const cat = categories.find(
              (c) => c.id === fetchedArticle.category_id || c.id === fetchedArticle.categoryId
            );
            setCategory(cat);
          }

          // Load feedbacks
          if (fetchedArticle && kbService.listFeedback) {
            const fetchedFeedbacks = kbService.listFeedback(id);
            setFeedbacks(Array.isArray(fetchedFeedbacks) ? fetchedFeedbacks : []);
          }
        }
      } catch (err) {
        console.error('Failed to load article:', err);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [id]);

  const openDeleteModal = () => {
    setDeleteModal({ isOpen: true, isDeleting: false });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, isDeleting: false });
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      if (kbService.updateArticle) {
        await kbService.updateArticle(article.id, { deleted: true });
        navigate('/admin/knowledge/articles');
      }
    } catch (err) {
      console.error('Failed to delete article:', err);
      setDeleteModal({ isOpen: false, isDeleting: false });
    }
  };

  const openArchiveModal = () => {
    setArchiveModal({ isOpen: true, isArchiving: false });
  };

  const closeArchiveModal = () => {
    setArchiveModal({ isOpen: false, isArchiving: false });
  };

  const confirmArchive = async () => {
    setArchiveModal((prev) => ({ ...prev, isArchiving: true }));
    try {
      if (kbService.updateArticle) {
        await kbService.updateArticle(article.id, { archived: true });
        navigate('/admin/knowledge/articles');
      }
    } catch (err) {
      console.error('Failed to archive article:', err);
      setArchiveModal({ isOpen: false, isArchiving: false });
    }
  };

  const userRole = authService.getUserRole();
  const canEdit = userRole === 'System Admin' || userRole === 'Ticket Coordinator';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      if (isNaN(d)) return 'N/A';
      const monthName = d.toLocaleString('en-US', { month: 'long' });
      const day = d.getDate();
      const year = d.getFullYear();
      return `${monthName} ${day}, ${year}`;
    } catch (e) {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <ViewCard>
        <div className={styles.contentGrid}>
          <div className={styles.leftColumn}>
            <div className={localStyles.loadingContainer}>
              <Loading text="Loading article..." centered />
            </div>
          </div>
        </div>
      </ViewCard>
    );
  }

  if (!article) {
    return (
      <div className={localStyles.notFoundContainer}>
        <h1 className={localStyles.notFoundText}>Article Not Found</h1>
        <Button onClick={() => navigate('/admin/knowledge/articles')} className={localStyles.backButton}>
          <FaArrowLeft /> Go Back
        </Button>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className={localStyles.notFoundContainer}>
        <h1 className={localStyles.notFoundText}>Not authorized</h1>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>You do not have permission to view this article.</p>
        <Button onClick={() => navigate('/admin/knowledge/articles')} className={localStyles.backButton}>
          <FaArrowLeft /> Go Back
        </Button>
      </div>
    );
  }

  if (runtimeError) {
    return (
      <ViewCard>
        <div style={{ padding: 24 }}>
          <h2 style={{ color: '#b91c1c' }}>Application Error</h2>
          <p>An unexpected error occurred while rendering this article.</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#0f172a', color: '#e5e7eb', padding: '12px', borderRadius: 6 }}>{String(runtimeError)}</pre>
          <div style={{ marginTop: 12 }}>
            <Button onClick={() => window.location.reload()}>Reload</Button>
            <Button onClick={() => navigate('/admin/knowledge/articles')} style={{ marginLeft: 8 }}>Go Back</Button>
          </div>
        </div>
      </ViewCard>
    );
  }

  const visibilityMap = {
    'system admin': { badge: 'System Admin', color: '#FEF3C7', textColor: '#92400E' },
    'ticket coordinator': { badge: 'Coordinator', color: '#DBEAFE', textColor: '#1E40AF' },
    'employee': { badge: 'Employee', color: '#D1FAE5', textColor: '#065F46' }
  };
  const visData = visibilityMap[article.visibility?.toLowerCase()] || visibilityMap['employee'];

  return (
    <>
      <main className={styles.employeeTicketTrackerPage}>
        <Breadcrumb
          root="Knowledge Base"
          currentPage="Article View"
          rootNavigatePage="/admin/knowledge/articles"
          title={article.title}
        />
        <ViewCard>
          <div className={styles.contentGrid}>
            {/* LEFT COLUMN - Article Details */}
            <div ref={leftColRef} className={styles.leftColumn}>
              <section className={styles.ticketCard}>
                {/* Header with Visibility Badge and Title */}
                <div className={styles.ticketHeader}>
                  <div className={styles.headerLeft}>
                    <div
                      className={`${styles.priorityBadge} ${styles.priorityMedium}`}
                      style={{
                        background: visData.color,
                        color: visData.textColor,
                      }}
                    >
                      {visData.badge}
                    </div>
                    <h2 className={styles.ticketSubject}>{article.title}</h2>
                  </div>
                </div>

                {/* Meta Information */}
                <div className={styles.ticketMeta}>
                  <div className={styles.ticketMetaItem}>
                    <span className={styles.ticketMetaLabel}>
                      Date Created <span className={styles.ticketMetaValue}>{formatDate(article.date_created || article.dateCreated)}</span>
                    </span>
                  </div>
                  <div className={styles.ticketMetaItem}>
                    <span className={styles.ticketMetaLabel}>
                      Date Updated <span className={styles.ticketMetaValue}>{formatDate(article.date_modified || article.dateModified)}</span>
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Category</div>
                    <div className={styles.detailValue}>
                      {category ? category.name : 'Uncategorized'}
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Author</div>
                    <div className={styles.detailValue}>
                      {article.author || 'Unknown'}
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Visibility</div>
                    <div className={styles.detailValue}>
                      {visData.badge}
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Status</div>
                    <div className={styles.detailValue}>
                      {article.archived ? 'Archived' : 'Active'}
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Feedback</div>
                    <div className={styles.detailValue}>
                      <div className={localStyles.feedbackStats}>
                        <span className={localStyles.feedbackLikes}>
                          👍 {feedbacks.filter(f => f.helpful).length} Helpful
                        </span>
                        <span className={localStyles.feedbackDislikes}>
                          👎 {feedbacks.filter(f => !f.helpful).length} Not Helpful
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Full-width Content Section */}
                  <div className={styles.singleColumnGroup}>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Article Content</div>
                      <div className={styles.detailValue}>
                        {article.content || 'No content provided.'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN - Actions and Feedback */}
            <div ref={rightColRef} className={`${styles.rightColumn} ${detailStyles.rightColumnFill}`}>
              {/* Action Buttons */}
              {canEdit && (
                <div className={localStyles.actionButtonsContainer}>
                  <Button
                    variant="primary"
                    className={localStyles.actionButton}
                    onClick={() => navigate(`/admin/knowledge/create?edit=${article.id}`)}
                  >
                    <FaEdit /> <span className={localStyles.buttonText}>Edit</span>
                  </Button>
                  <Button
                    variant="primary"
                    className={localStyles.actionButton}
                    onClick={openArchiveModal}
                    style={{ background: '#2563EB' }}
                  >
                    <FaArchive /> <span className={localStyles.buttonText}>Archive</span>
                  </Button>
                  <Button
                    variant="danger"
                    className={localStyles.actionButton}
                    onClick={openDeleteModal}
                    style={{ background: '#ef4444' }}
                  >
                    <FaTrash /> <span className={localStyles.buttonText}>Delete</span>
                  </Button>
                </div>
              )}

              {/* Tabs for Feedback and Info */}
              <Tabs
                tabs={[
                  { label: 'Feedback', value: 'details' },
                  { label: 'Info', value: 'info' }
                ]}
                active={activeTab}
                onChange={setActiveTab}
                fullHeight={true}
                className={detailStyles.tabsFill}
              >
                {activeTab === 'details' ? (
                  <div className={localStyles.feedbackContainer}>
                    {feedbacks.length === 0 ? (
                      <div className={localStyles.emptyState}>
                        No feedback yet
                      </div>
                    ) : (
                      <div className={localStyles.feedbackList}>
                        {feedbacks.map((feedback, idx) => (
                          <div key={idx} className={localStyles.feedbackItem}>
                            <div className={localStyles.feedbackItemHeader}>
                              <span className={localStyles.feedbackDate}>
                                {new Date(feedback.date).toLocaleDateString()}
                              </span>
                              <span
                                className={`${localStyles.feedbackStatus} ${
                                  feedback.helpful ? localStyles.statusHelpful : localStyles.statusNotHelpful
                                }`}
                              >
                                {feedback.helpful ? 'Helpful' : 'Not Helpful'}
                              </span>
                            </div>
                            {feedback.comment && (
                              <div className={localStyles.feedbackComment}>
                                {feedback.comment}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={localStyles.infoTab}>
                    <div className={localStyles.infoItem}>
                      <strong>Created:</strong> {formatDate(article.date_created || article.dateCreated)}
                    </div>
                    <div className={localStyles.infoItem}>
                      <strong>Last Modified:</strong> {formatDate(article.date_modified || article.dateModified)}
                    </div>
                    <div className={localStyles.infoItem}>
                      <strong>Category:</strong> {category ? category.name : 'Uncategorized'}
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className={localStyles.infoItem}>
                        <strong>Tags:</strong> {article.tags.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </Tabs>
            </div>
          </div>
        </ViewCard>
      </main>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Article"
        message={`Are you sure you want to delete "${article?.title}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        isDeleting={deleteModal.isDeleting}
      />

      <ArchiveConfirmationModal
        isOpen={archiveModal.isOpen}
        title="Article"
        message={`Are you sure you want to archive "${article?.title}"? You can restore archived items later if needed.`}
        onConfirm={confirmArchive}
        onCancel={closeArchiveModal}
        isArchiving={archiveModal.isArchiving}
      />
    </>
  );
};

export default KnowledgeArticleView;
