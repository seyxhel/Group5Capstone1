import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import styles from "./CoordinatorAdminRejectTicketModal.module.css";
import 'react-toastify/dist/ReactToastify.css';
import ModalWrapper from "../../../shared/modals/ModalWrapper";

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const CoordinatorAdminRejectUserModal = ({ user, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error("Reason is required to reject a user.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    if (!/[a-zA-Z0-9]/.test(reason)) {
      toast.error("Reason must contain at least one letter or number.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_access_token");
      const res = await fetch(`${API_URL}employees/${user.id}/reject/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || "Failed to reject user");
      }

      toast.success(`User ${user.firstName} ${user.lastName} rejected successfully.`, {
        position: "top-right",
        autoClose: 3000,
      });

      onSuccess?.(user.id, "Rejected");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to reject user. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <h2 className={styles.heading}>
        Reject User {user.firstName} {user.lastName}
      </h2>

      <div className={styles.field}>
        <label>
          Reason <span className={styles.required}>*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className={styles.textarea}
          placeholder="Provide a reason for rejection"
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className={styles.cancel}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={isSubmitting}
          className={styles.reject}
        >
          {isSubmitting ? "Rejecting..." : "Reject User"}
        </button>
      </div>
    </>
  );
};

export default CoordinatorAdminRejectUserModal;
