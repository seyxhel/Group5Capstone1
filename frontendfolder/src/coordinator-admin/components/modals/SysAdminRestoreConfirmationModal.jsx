import React, { useState } from 'react';
import { FaUndo } from 'react-icons/fa';
import ModalWrapper from '../../../shared/modals/ModalWrapper';
import styles from './SysAdminDeleteConfirmationModal.module.css';

const SysAdminRestoreConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, isRestoring = false }) => {
  if (!isOpen) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRestore = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper onClose={onCancel}>
      <div className={styles.container}>
        <div className={styles.iconSection}>
          <div className={styles.iconWrapper}>
            <FaUndo className={styles.deleteIcon} />
          </div>
        </div>

        <h2 className={styles.heading}>Restore {title}</h2>
        
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={isSubmitting || isRestoring} 
            className={styles.cancel}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleRestore} 
            disabled={isSubmitting || isRestoring} 
            className={styles.delete}
          >
            {isSubmitting || isRestoring ? 'Restoring...' : 'Restore'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default SysAdminRestoreConfirmationModal;
