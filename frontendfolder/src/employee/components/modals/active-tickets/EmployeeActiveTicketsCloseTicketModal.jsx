import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import ModalWrapper from "../../../../shared/modals/ModalWrapper";
import styles from "./EmployeeActiveTicketsCloseTicketModal.module.css";
import 'react-toastify/dist/ReactToastify.css';

const EmployeeActiveTicketsCloseTicketModal = ({ ticket, onClose, onSuccess }) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("employee_access_token");
      const res = await fetch(
        `${import.meta.env.VITE_REACT_APP_API_URL}tickets/${ticket.id}/close/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comment }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to close the ticket.");
      }

      toast.success(`Ticket #${ticket.ticketNumber} closed successfully.`, {
        position: "top-right",
        autoClose: 3000,
      });

      onSuccess?.(ticket.ticketNumber, "Closed");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to close the ticket. Please try again.", {
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
        Close Ticket {ticket.ticketNumber}
      </h2>

      <div className={styles.field}>
        <label>
          Optional Comment
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className={styles.textarea}
          placeholder="Add an optional comment"
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
          onClick={handleClose}
          disabled={isSubmitting}
          className={styles.confirm}
        >
          {isSubmitting ? "Closing..." : "Close Ticket"}
        </button>
      </div>
    </ModalWrapper>
  );
};

export default EmployeeActiveTicketsCloseTicketModal;
