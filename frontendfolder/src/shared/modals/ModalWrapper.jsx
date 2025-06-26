import styles from './ModalWrapper.module.css';

const ModalWrapper = ({ children, onClose }) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className={styles['modal-overlay']} onClick={handleOverlayClick}>
      <div className={styles['modal-content']}>
        {children}
      </div>
    </div>
  );
};

export default ModalWrapper;
