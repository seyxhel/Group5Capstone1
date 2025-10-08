import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import ModalWrapper from "../../../shared/modals/ModalWrapper";
import styles from "./CoordinatorAdminRejectTicketModal.module.css";
import 'react-toastify/dist/ReactToastify.css';

const CoordinatorAdminRejectTicketModal = ({ ticket, onClose, onSuccess }) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error("Comment is required to reject a ticket.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate API

      toast.success(`Ticket #${ticket.ticketNumber} rejected successfully.`, {
        position: "top-right",
        autoClose: 3000,
      });

      onSuccess?.(ticket.ticketNumber, "Rejected"); // ✅ update parent
      onClose();
    } catch (err) {
      toast.error("Failed to reject ticket. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <ToastContainer />
      <h2 className={styles.heading}>
        Reject Ticket {ticket.ticketNumber} by {ticket.createdBy?.name || "User"}
      </h2>

      <div className={styles.field}>
        <label>
          Comment <span className={styles.required}>*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
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
          {isSubmitting ? "Rejecting..." : "Reject Ticket"}
        </button>
      </div>
    </ModalWrapper>
  );
};

export default CoordinatorAdminRejectTicketModal;
