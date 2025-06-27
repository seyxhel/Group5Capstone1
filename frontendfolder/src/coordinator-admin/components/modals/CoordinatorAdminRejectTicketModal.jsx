import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import styles from "./CoordinatorAdminRejectTicketModal.module.css";
import 'react-toastify/dist/ReactToastify.css';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

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
      const token = localStorage.getItem("admin_access_token");
      const res = await fetch(`${API_URL}tickets/${ticket.id}/reject/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rejection_reason: comment,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reject ticket");
      }

      toast.success(`Ticket #${ticket.ticket_number || ticket.ticketNumber} rejected successfully.`, {
        position: "top-right",
        autoClose: 3000,
      });

      onSuccess?.(ticket.ticket_number || ticket.ticketNumber, "Rejected");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to reject ticket. Please try again.", {
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
        Reject Ticket {ticket.ticket_number || ticket.ticketNumber} by {ticket.createdBy?.name || "User"}
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
    </>
  );
};

export default CoordinatorAdminRejectTicketModal;
