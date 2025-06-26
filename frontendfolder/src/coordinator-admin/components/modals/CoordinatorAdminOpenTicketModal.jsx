import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import ModalWrapper from "../../../shared/modals/ModalWrapper";

import priorityLevelOptions from "../../../utilities/options/priorityLevelOptions";
import departmentOptions from "../../../utilities/options/departmentOptions";

const MEDIA_URL = import.meta.env.VITE_MEDIA_URL;

const CoordinatorAdminOpenTicketModal = ({ ticket, onClose }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      priority: ticket.priority || "",
      department: ticket.department || "",
      comment: "",
    },
  });

  useEffect(() => {
    reset({
      priority: ticket.priority || "",
      department: ticket.department || "",
      comment: "",
    });
  }, [ticket, reset]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = (data) => {
    setIsSubmitting(true);

    // TODO: Replace with real API call to update ticket
    setTimeout(() => {
      setIsSubmitting(false);
      alert(
        "Ticket updated with:\n" + 
        JSON.stringify(data, null, 2)
      );
      onClose();
    }, 1000);
  };

  // Only allow for New and Pending tickets
  if (!["New", "Pending"].includes(ticket.status)) {
    return (
      <ModalWrapper onClose={onClose}>
        <h2>Open Ticket</h2>
        <p>This action is only available for tickets with status "New" or "Pending".</p>
        <button onClick={onClose}>Close</button>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper onClose={onClose}>
      <h2>
        {ticket.status} Ticket - {ticket.ticket_number}
      </h2>

      {/* Ticket details */}
      <div style={{ marginBottom: 16 }}>
        <strong>Created By:</strong>{" "}
        {ticket.employee
          ? `${ticket.employee.first_name} ${ticket.employee.last_name}`
          : "Unknown"} <br />
        <strong>Company ID:</strong> {ticket.employee?.company_id || "N/A"} <br />
        <strong>Department:</strong> {ticket.employee?.department || "—"} <br />
        <strong>Scheduled Request:</strong> {ticket.scheduled_request || "—"} <br />
        <strong>Date Created:</strong> {ticket.submit_date ? new Date(ticket.submit_date).toLocaleString() : "—"} <br />
        <strong>Last Updated:</strong> {ticket.last_updated
          ? new Date(ticket.last_updated).toLocaleString()
          : (ticket.submit_date ? new Date(ticket.submit_date).toLocaleString() : "—")} <br />
        <strong>Subject:</strong> {ticket.subject || "—"} <br />
        <strong>Category:</strong> {ticket.category || "—"} <br />
        <strong>Sub Category:</strong> {ticket.sub_category || "—"} <br />
        <strong>File Uploaded:</strong>{" "}
        {Array.isArray(ticket.attachments) && ticket.attachments.length > 0
          ? ticket.attachments.map((file, idx) => (
              <span key={file.id || idx}>
                <a
                  href={
                    file.file.startsWith("http")
                      ? file.file
                      : `${MEDIA_URL}${file.file.startsWith("/") ? file.file.slice(1) : file.file}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  download={file.file_name}
                  style={{ marginRight: 8 }}
                >
                  {file.file_name}
                </a>
                {idx < ticket.attachments.length - 1 ? ", " : ""}
              </span>
            ))
          : "—"}
      </div>

      {/* Editable form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Priority Level (Required) */}
        <fieldset style={{ marginBottom: 12 }}>
          <label>
            Priority Level <span style={{ color: "red" }}>*</span>
          </label>
          <select
            {...register("priority", { required: "Priority Level is required" })}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          >
            <option value="">Select Priority Level</option>
            {priorityLevelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.priority && (
            <p style={{ color: "red", marginTop: 4 }}>{errors.priority.message}</p>
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
            {isSubmitting ? "Opening Ticket..." : "Open Ticket"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default CoordinatorAdminOpenTicketModal;
