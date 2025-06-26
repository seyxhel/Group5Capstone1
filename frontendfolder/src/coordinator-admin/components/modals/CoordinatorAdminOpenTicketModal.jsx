import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import ModalWrapper from "../../../shared/modals/ModalWrapper";

import priorityLevelOptions from "../../../utilities/options/priorityLevelOptions";
import departmentOptions from "../../../utilities/options/departmentOptions";

const CoordinatorAdminOpenTicketModal = ({ ticket, onClose }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      priorityLevel: ticket.priorityLevel || "",
      department: ticket.department || "",
      comment: "", // optional admin comment
    },
  });

  useEffect(() => {
    reset({
      priorityLevel: ticket.priorityLevel || "",
      department: ticket.department || "",
      comment: "",
    });
  }, [ticket, reset]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = (data) => {
    setIsSubmitting(true);

    // Simulate API call or state update
    setTimeout(() => {
      setIsSubmitting(false);
      alert(
        "Ticket updated with:\n" + 
        JSON.stringify(data, null, 2)
      );
      onClose();
    }, 1000);
  };

  return (
    <ModalWrapper onClose={onClose}>
      <h2>Open Ticket - {ticket.ticketNumber}</h2>

      {/* Ticket details */}
      <div style={{ marginBottom: 16 }}>
        <strong>Created By:</strong> {ticket.createdBy?.name || "Unknown"} <br />
        <strong>Company ID:</strong> {ticket.createdBy?.companyId || "N/A"} <br />
        <strong>Department ID:</strong> {ticket.createdBy?.departmentId || "N/A"} <br />
        {ticket.createdBy?.profilePicture && (
          <>
            <strong>Profile Picture:</strong>
            <br />
            <img
              src={ticket.createdBy.profilePicture}
              alt="Profile"
              style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }}
            />
          </>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Priority:</strong> {ticket.priorityLevel || "—"} <br />
        <strong>Department:</strong> {ticket.department || "—"} <br />
        <strong>Assigned Agent:</strong> {ticket.assignedAgent || "—"} <br />
        <strong>Scheduled Request:</strong> {ticket.scheduledRequest || "—"} <br />
        <strong>Date Created:</strong> {ticket.dateCreated?.slice(0, 10) || "—"} <br />
        <strong>Last Updated:</strong> {ticket.lastUpdated?.slice(0, 10) || "—"} <br />
        <strong>Subject:</strong> {ticket.subject || "—"} <br />
        <strong>Category:</strong> {ticket.category || "—"} <br />
        <strong>Sub Category:</strong> {ticket.subCategory || "—"} <br />
        <strong>File Uploaded:</strong>{" "}
        {ticket.fileUploaded ? (
          <a href={ticket.fileUploaded} target="_blank" rel="noreferrer">
            View File
          </a>
        ) : (
          "—"
        )}
      </div>

      {/* Editable form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Priority Level (Required) */}
        <fieldset style={{ marginBottom: 12 }}>
          <label>
            Priority Level <span style={{ color: "red" }}>*</span>
          </label>
          <select
            {...register("priorityLevel", { required: "Priority Level is required" })}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          >
            <option value="">Select Priority Level</option>
            {priorityLevelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.priorityLevel && (
            <p style={{ color: "red", marginTop: 4 }}>{errors.priorityLevel.message}</p>
          )}
        </fieldset>

        {/* Department (Required) */}
        <fieldset style={{ marginBottom: 12 }}>
          <label>
            Department <span style={{ color: "red" }}>*</span>
          </label>
          <select
            {...register("department", { required: "Department is required" })}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          >
            <option value="">Select Department</option>
            {departmentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.department && (
            <p style={{ color: "red", marginTop: 4 }}>{errors.department.message}</p>
          )}
        </fieldset>

        {/* Comment (Optional) */}
        <fieldset style={{ marginBottom: 12 }}>
          <label>Comment (Optional)</label>
          <textarea
            {...register("comment")}
            placeholder="Add your comment or notes here"
            rows={4}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </fieldset>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "8px 16px", cursor: "pointer" }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{ padding: "8px 16px", cursor: "pointer" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Opening..." : "Open"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default CoordinatorAdminOpenTicketModal;
