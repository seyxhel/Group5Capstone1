import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import ModalWrapper from "../../../shared/modals/ModalWrapper";
import priorityLevelOptions from "../../../utilities/options/priorityLevelOptions";
import departmentOptions from "../../../utilities/options/departmentOptions";
import styles from "./CoordinatorAdminOpenTicketModal.module.css";
import 'react-toastify/dist/ReactToastify.css';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const CoordinatorAdminOpenTicketModal = ({ ticket, onClose, onSuccess }) => {
  const { register, handleSubmit, reset, formState: { errors, touchedFields }, trigger } = useForm();
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
      const token = localStorage.getItem("admin_access_token");
      const res = await fetch(`${API_URL}tickets/${ticket.id}/approve/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priority: data.priority,
          department: data.department,
          approval_notes: data.comment,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to approve ticket");
      }

      toast.success(`Ticket #${ticket.ticket_number} approved successfully.`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });

      onSuccess?.(ticket.ticket_number, "Open");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to approve ticket. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Blur effect style for modal content
  const blurStyle = isSubmitting
    ? { filter: "blur(3px)", pointerEvents: "none", userSelect: "none" }
    : {};

  return (
    <>
      <ToastContainer />
      <div style={{ position: "relative" }}>
        {/* Blur the modal content when submitting */}
        <div style={blurStyle}>
          <h2 className={styles.heading}>
            Approve Ticket {ticket.ticketNumber} by {ticket.createdBy?.name || "User"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.field}>
              <label>
                Priority Level <span className={styles.required}>*</span>
              </label>
              <select
                {...register("priority", { required: "Priority Level is required." })}
                className={styles.input}
                onBlur={() => trigger("priority")}
                disabled={isSubmitting}
              >
                <option value="">Select Priority Level</option>
                {priorityLevelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {touchedFields.priority && errors.priority && (
                <p className={styles.error}>{errors.priority.message}</p>
              )}
            </div>

            <div className={styles.field}>
              <label>
                Department <span className={styles.required}>*</span>
              </label>
              <select
                {...register("department", { required: "Department is required." })}
                className={styles.input}
                onBlur={() => trigger("department")}
                disabled={isSubmitting}
              >
                <option value="">Select Department</option>
                {departmentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {touchedFields.department && errors.department && (
                <p className={styles.error}>{errors.department.message}</p>
              )}
            </div>

            <div className={styles.field}>
              <label>Comment (Optional)</label>
              <textarea {...register("comment")} rows={3} className={styles.textarea} placeholder="Add a note..." disabled={isSubmitting} />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: "8px 16px", cursor: "pointer" }}
                disabled={isSubmitting}
                className={styles.cancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
                  cursor: "pointer",
                  background: "#22c55e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px"
                }}
                disabled={isSubmitting}
                className={styles.submit}
              >
                Approve Ticket
              </button>
            </div>
          </form>
        </div>
        {/* Loading overlay */}
        {isSubmitting && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.4)",
              zIndex: 10,
              borderRadius: "12px"
            }}
          >
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <span className="loader" style={{
                width: 40,
                height: 40,
                border: "4px solid #22c55e",
                borderTop: "4px solid #fff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: 12
              }} />
              <span style={{ color: "#22c55e", fontWeight: 600, fontSize: 18 }}>Approving Ticket...</span>
              <style>
                {`
                  @keyframes spin {
                    0% { transform: rotate(0deg);}
                    100% { transform: rotate(360deg);}
                  }
                `}
              </style>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CoordinatorAdminOpenTicketModal;
