import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import ModalWrapper from "../../../../shared/modals/ModalWrapper";
import styles from "./EmployeeActiveTicketsWithdrawTicketModal.module.css";
import 'react-toastify/dist/ReactToastify.css';

const EmployeeActiveTicketsWithdrawTicketModal = ({ ticket, onClose, onSuccess }) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdraw = async () => {
    if (!comment.trim()) {
      toast.error("Please provide a reason for withdrawal.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    // Restrict to not just punctuation
    if (!/[a-zA-Z0-9]/.test(comment)) {
      toast.error("Reason must contain at least one letter or number.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("employee_access_token");
      const res = await fetch(
        `${import.meta.env.VITE_REACT_APP_API_URL}tickets/${ticket.id}/withdraw/`,
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
        throw new Error(data.error || "Failed to withdraw ticket.");
      }

      toast.success(`Ticket #${ticket.ticketNumber} withdrawn successfully.`, {
        position: "top-right",
        autoClose: 3000,
      });

      onSuccess?.(ticket.ticketNumber, "Withdrawn");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to withdraw ticket. Please try again.", {
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
        Withdraw Ticket {ticket.ticketNumber}
      </h2>

      <div className={styles.field}>
        <label>
          Reason for Withdrawal <span className={styles.required}>*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className={styles.textarea}
          placeholder="Provide your reason here..."
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
          onClick={handleWithdraw}
          disabled={isSubmitting}
          className={styles.confirm}
        >
          {isSubmitting ? "Withdrawing..." : "Withdraw Ticket"}
        </button>
      </div>
    </ModalWrapper>
  );
};

export default EmployeeActiveTicketsWithdrawTicketModal;
