import React, { useEffect, useState, useRef } from 'react';
import styles from './ArticlePreview.module.css';
import FeedbackWidget from './FeedbackWidget';
import kbService from '../../services/kbService';

const ArticlePreview = ({ article, onClose }) => {
  const [feedbacks, setFeedbacks] = useState([]);

  const modalRef = useRef(null);
  const lastFocused = useRef(null);

  useEffect(() => {
    if (article && article.id) kbService.listFeedback(article.id).then(setFeedbacks);
  }, [article]);

  useEffect(() => {
    // remember opener
    lastFocused.current = document.activeElement;
    // focus first focusable inside modal
    const focusable = modalRef.current && modalRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose && onClose();
      }
      if (e.key === 'Tab') {
        // simple focus trap
        const nodes = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // restore focus
      try { lastFocused.current && lastFocused.current.focus(); } catch (err) {}
    };
  }, [onClose]);

  const handleSubmitFeedback = async (payload) => {
    await kbService.submitFeedback(payload);
    const updated = await kbService.listFeedback(article.id);
    setFeedbacks(updated);
  };

  if (!article) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div ref={modalRef} className={styles.modal}>
        <button className={styles.close} onClick={onClose} aria-label="Close">×</button>
        <h2 className={styles.title}>{article.title}</h2>
        <p className={styles.meta}>By {article.author} — Updated {article.date_modified}</p>
        <div className={styles.content}>{article.content}</div>

        <div className={styles.feedbackSection}>
          <h3>Feedback</h3>
          <FeedbackWidget articleId={article.id} onSubmit={(p) => handleSubmitFeedback({ ...p, articleId: article.id })} />
          <div className={styles.feedbackList}>
            {feedbacks.length === 0 ? <p>No feedback yet.</p> : (
              feedbacks.map(f => (
                <div key={f.id} className={styles.feedbackItem}>
                  <div><strong>{f.helpful ? 'Helpful' : 'Not helpful'}</strong> — {new Date(f.date).toLocaleString()}</div>
                  {f.comment && <div className={styles.comment}>{f.comment}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlePreview;
