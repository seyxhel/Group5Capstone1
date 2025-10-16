import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { backendTicketService } from '../../../services/backend/ticketService';
import authService from '../../../utilities/service/authService';
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
      priorityLevel: ticket.priorityLevel || ticket.priority || ticket.priority_level || "",
      department: ticket.department || ticket.assignedDepartment || ticket.employeeDepartment || "",
      comment: "",
    });
  }, [ticket, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const ticketId = ticket.id || ticket.ticket_id || ticket.ticketId || null;
      if (!ticketId) throw new Error('Ticket id missing');

      // Map frontend priority values to backend expected values
      const priorityMap = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical'
      };
      const selectedPriority = (data.priorityLevel || ticket.priority || ticket.priority_level || '').toString();
      const mappedPriority = priorityMap[selectedPriority.toLowerCase()] || (ticket.priority || ticket.priority_level || 'Low');

      // Use the backend approve endpoint to set status -> Open and persist priority/department
      await backendTicketService.approveTicket(ticketId, {
        priority: mappedPriority,
        department: data.department || ticket.department || ticket.assignedDepartment,
        approval_notes: data.comment || ''
      });

      toast.success(`Ticket #${ticket.ticketNumber} opened successfully.`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      onSuccess?.(ticket.ticketNumber, "Open"); // ✅ update parent state
      onClose();
    } catch (err) {
      console.error('OpenTicket error:', err);
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
        {(() => {
          const ownerName = (ticket.employee && (ticket.employee.first_name || ticket.employee.firstName))
            ? `${ticket.employee.first_name || ticket.employee.firstName} ${ticket.employee.last_name || ticket.employee.lastName}`.trim()
            : ticket.employee_name || ticket.employeeName || ticket.createdBy?.name || '';
          return ownerName ? `Approve Ticket ${ticket.ticketNumber} for ${ownerName}` : `Approve Ticket ${ticket.ticketNumber}`;
        })()}
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
