import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import ModalWrapper from "../../../shared/modals/ModalWrapper";
import priorityLevelOptions from "../../../utilities/options/priorityLevelOptions";
import departmentOptions from "../../../utilities/options/departmentOptions";
import styles from "./CoordinatorAdminOpenTicketModal.module.css";
import 'react-toastify/dist/ReactToastify.css';

const CoordinatorAdminOpenTicketModal = ({ ticket, onClose, onSuccess }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    reset({
      priority: ticket.priority || "",
      department: ticket.department || "",
      comment: "",
    });
  }, [ticket, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate API

      toast.success(`Ticket #${ticket.ticketNumber} approved successfully.`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });

      onSuccess?.(ticket.ticketNumber, "Open"); // ✅ update parent state
      onClose();
    } catch (err) {
      toast.error("Failed to approve ticket. Please try again.", {
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
        Approve Ticket {ticket.ticketNumber} by {ticket.createdBy?.name || "User"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.field}>
          <label>
            Priority Level <span className={styles.required}>*</span>
          </label>
          <select {...register("priorityLevel", { required: "Priority Level is required" })} className={styles.input}>
            <option value="">Select Priority Level</option>
            {priorityLevelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.priorityLevel && <p className={styles.error}>{errors.priorityLevel.message}</p>}
        </div>

        <div className={styles.field}>
          <label>
            Department <span className={styles.required}>*</span>
          </label>
          <select {...register("department", { required: "Department is required" })} className={styles.input}>
            <option value="">Select Department</option>
            {departmentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.department && <p className={styles.error}>{errors.department.message}</p>}
        </div>

        <div className={styles.field}>
          <label>Comment (Optional)</label>
          <textarea {...register("comment")} rows={3} className={styles.textarea} placeholder="Add a note..." />
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.cancel}>Cancel</button>
          <button type="submit" disabled={isSubmitting} className={styles.submit}>
            {isSubmitting ? "Approving..." : "Open Ticket"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default CoordinatorAdminOpenTicketModal;
