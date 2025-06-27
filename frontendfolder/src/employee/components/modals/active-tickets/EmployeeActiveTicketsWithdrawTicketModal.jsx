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

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated API call

      toast.success(`Ticket #${ticket.ticketNumber} withdrawn successfully.`, {
        position: "top-right",
        autoClose: 3000,
      });

      onSuccess?.(ticket.ticketNumber, "Withdrawn");
      onClose();
    } catch (err) {
      toast.error("Failed to withdraw ticket. Please try again.", {
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
