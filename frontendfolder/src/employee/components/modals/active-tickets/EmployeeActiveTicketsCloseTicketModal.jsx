import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import ModalWrapper from "../../../../shared/modals/ModalWrapper";
import EmployeeCSATModal from "../csat/EmployeeCSATModal";
import styles from "./EmployeeActiveTicketsCloseTicketModal.module.css";
import 'react-toastify/dist/ReactToastify.css';

const EmployeeActiveTicketsCloseTicketModal = ({ ticket, onClose, onSuccess }) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCSAT, setShowCSAT] = useState(false);

  const handleClose = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate API

      toast.success(`Ticket #${ticket.ticketNumber} closed successfully.`, {
        position: "top-right",
        autoClose: 3000,
      });

      onSuccess?.(ticket.ticketNumber, "Closed");
      
      // Show CSAT modal after successful close
      setShowCSAT(true);
    } catch (err) {
      toast.error("Failed to close the ticket. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCSATClose = () => {
    setShowCSAT(false);
    onClose();
  };

  // Show CSAT modal if ticket was closed
  if (showCSAT) {
    return <EmployeeCSATModal ticket={ticket} onClose={handleCSATClose} />;
  }

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
