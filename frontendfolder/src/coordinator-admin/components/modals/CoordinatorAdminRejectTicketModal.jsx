import { useState } from "react";
import ModalWrapper from "../../../shared/modals/ModalWrapper";

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const CoordinatorAdminRejectTicketModal = ({ ticket, onClose }) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async () => {
    if (!comment.trim()) {
      alert("Comment is required.");
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
      onClose();
    } catch (err) {
      alert(err.message || "Failed to reject ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <h1>Reject Ticket</h1>

      {/* Ticket Info */}
      <p><strong>Ticket Number:</strong> {ticket.ticket_number}</p>
      <p><strong>Created By:</strong> {ticket.employee
        ? `${ticket.employee.first_name} ${ticket.employee.last_name}`
        : "Unknown"}</p>
      <p><strong>Department:</strong> {ticket.employee?.department || "—"}</p>
      <p><strong>Scheduled Request:</strong> {ticket.scheduled_request || "—"}</p>
      <p><strong>Date Created:</strong> {ticket.submit_date ? new Date(ticket.submit_date).toLocaleString() : "—"}</p>
      <p><strong>Last Updated:</strong> {ticket.last_updated
        ? new Date(ticket.last_updated).toLocaleString()
        : (ticket.submit_date ? new Date(ticket.submit_date).toLocaleString() : "—")}</p>
      <p><strong>Subject:</strong> {ticket.subject || "—"}</p>
      <p><strong>Category:</strong> {ticket.category || "—"}</p>
      <p><strong>Sub Category:</strong> {ticket.sub_category || "—"}</p>
      <p><strong>File Uploaded:</strong>{" "}
        {Array.isArray(ticket.attachments) && ticket.attachments.length > 0
          ? ticket.attachments.map((file, idx) => (
              <span key={file.id || idx}>
                <a
                  href={
                    file.file.startsWith("http")
                      ? file.file
                      : `${import.meta.env.VITE_MEDIA_URL}${file.file.startsWith("/") ? file.file.slice(1) : file.file}`
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
      </p>

      {/* Required comment */}
      <div style={{ marginTop: "1rem" }}>
        <label htmlFor="reject-comment">
          Comment <span style={{ color: "red" }}>*</span>
        </label>
        <textarea
          id="reject-comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          style={{ width: "100%", resize: "none", marginTop: "0.25rem", padding: "8px" }}
          placeholder="Add a comment for rejection"
          required
        />
      </div>

      {/* Action buttons */}
      <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
        <button
          onClick={onClose}
          type="button"
          style={{ padding: "8px 16px", cursor: "pointer" }}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          onClick={handleReject}
          type="button"
          style={{ backgroundColor: "red", color: "white", padding: "8px 16px", cursor: "pointer" }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Rejecting..." : "Reject Ticket"}
        </button>
      </div>
    </ModalWrapper>
  );
};

export default CoordinatorAdminRejectTicketModal;
