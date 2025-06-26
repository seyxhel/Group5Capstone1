import { useState } from "react";
import ModalWrapper from "../../../shared/modals/ModalWrapper";

const CoordinatorAdminRejectTicketModal = ({ ticket, onClose }) => {
  const [comment, setComment] = useState("");

  const handleReject = () => {
    // Here you would handle the reject logic, including using the comment if needed
    // e.g., send rejection with comment to API or state management
    console.log("Rejecting ticket:", ticket.ticketNumber, "with comment:", comment);
    onClose();
  };

  return (
    <ModalWrapper onClose={onClose}>
      <h1>Reject Ticket</h1>

      {/* Ticket Info */}
      <p><strong>Ticket Number:</strong> {ticket.ticketNumber}</p>
      <p><strong>Created By:</strong> {ticket.createdBy?.name || "Unknown"}</p>
      <p><strong>Company ID:</strong> {ticket.createdBy?.companyId || "N/A"}</p>
      <p><strong>Department ID:</strong> {ticket.createdBy?.departmentId || "N/A"}</p>
      <p><strong>Priority:</strong> {ticket.priorityLevel || "—"}</p>
      <p><strong>Department:</strong> {ticket.department || "—"}</p>
      <p><strong>Assigned Agent:</strong> {ticket.assignedAgent || "—"}</p>
      <p><strong>Scheduled Request:</strong> {ticket.scheduledRequest || "—"}</p>
      <p><strong>Date Created:</strong> {ticket.dateCreated?.slice(0, 10) || "—"}</p>
      <p><strong>Last Updated:</strong> {ticket.lastUpdated?.slice(0, 10) || "—"}</p>
      <p><strong>Subject:</strong> {ticket.subject || "—"}</p>
      <p><strong>Category:</strong> {ticket.category || "—"}</p>
      <p><strong>Sub Category:</strong> {ticket.subCategory || "—"}</p>
      <p><strong>File Uploaded:</strong> {ticket.fileUploaded ? ticket.fileUploaded.name || "Yes" : "None"}</p>

      {/* Optional comment */}
      <div style={{ marginTop: "1rem" }}>
        <label htmlFor="reject-comment">Comment (optional):</label>
        <textarea
          id="reject-comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          style={{ width: "100%", resize: "none", marginTop: "0.25rem", padding: "8px" }}
          placeholder="Add a comment for rejection (optional)"
        />
      </div>

      {/* Action buttons */}
      <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
        <button
          onClick={onClose}
          type="button"
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Cancel Ticket
        </button>
        <button
          onClick={handleReject}
          type="button"
          style={{ backgroundColor: "red", color: "white", padding: "8px 16px", cursor: "pointer" }}
        >
          Reject Ticket
        </button>
      </div>
    </ModalWrapper>
  );
};

export default CoordinatorAdminRejectTicketModal;
