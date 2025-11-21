import React, { useEffect, useRef } from 'react';
import styles from './KnowledgeArticleViewVersion.module.css';
import Button from '../../../../shared/components/Button';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const KnowledgeArticleViewVersion = ({
  version,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  onRestore,
  canRestore,
  article
}) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft') {
        onPrev?.();
      } else if (e.key === 'ArrowRight') {
        onNext?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  // Lock background scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev || 'auto';
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  const versionLabel = version?.number ?? version?.version ?? index + 1;
  const content = version?.content || version?.body || version?.text || version?.html || version?.raw || 'No content available for this version.';
  const changes = version?.changes || version?.summary || version?.description || version?.notes || '';

  const changeItems = String(changes || '')
    .split(/\r?\n|•|\-|\*+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.modalContent} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.versionInfo}>
            <h2 className={styles.versionTitle}>Version {versionLabel}</h2>
            <div className={styles.authorInfo}>{version?.author || version?.editor || article?.author || 'Unknown'}</div>
          </div>
          <div className={styles.navigationButtons}>
            <Button type="button" variant="nav" onClick={onPrev} disabled={index >= total - 1} title="Previous version (Left Arrow)"><FaChevronLeft /> <span style={{marginLeft:6}}>Prev</span></Button>
            <Button type="button" variant="nav" onClick={onNext} disabled={index <= 0} title="Next version (Right Arrow)"><span style={{marginRight:6}}>Next</span> <FaChevronRight /></Button>
            <Button type="button" variant="nav" onClick={onClose} className={styles.closeButton} title="Close (Esc)">Close</Button>
          </div>
        </div>

        <div className={styles.contentArea}>
          <div className={styles.previewSection}>
            <div className={styles.previewLabel}>Full Preview</div>
            <div className={styles.previewContent}>{content}</div>
          </div>

          <div className={styles.changesSection}>
            <div className={styles.changesTitle}>WHAT CHANGED</div>
            {changeItems.length > 0 ? (
              <ul className={styles.changesList}>
                {changeItems.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            ) : (
              <div className={styles.noChanges}>No change summary available.</div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerActions}>
            {canRestore && (
              <Button type="button" variant="primary" onClick={() => onRestore?.(version)} className={`${styles.actionButton} ${styles.primaryAction}`} title="Restore this version" disabled={!canRestore}>Restore</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeArticleViewVersion;
