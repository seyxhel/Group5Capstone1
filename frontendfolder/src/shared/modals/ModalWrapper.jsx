import { useEffect } from "react";
import ReactDOM from "react-dom";
import styles from "./ModalWrapper.module.css";

const ModalWrapper = ({ children, onClose }) => {
  // Lock background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return ReactDOM.createPortal(
    <div className={styles["modal-overlay"]} onClick={handleOverlayClick}>
      <div className={styles["modal-content"]}>{children}</div>
    </div>,
    document.body
  );
};

export default ModalWrapper;
