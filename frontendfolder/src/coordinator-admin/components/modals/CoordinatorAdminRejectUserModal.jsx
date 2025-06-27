// CoordinatorAdminRejectUserModal.jsx
import ModalWrapper from "../../../shared/modals/ModalWrapper";

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const CoordinatorAdminRejectUserModal = ({ user, onClose, onSuccess }) => {
  const handleReject = async () => {
    try {
      const token = localStorage.getItem("admin_access_token");
      const res = await fetch(`${API_URL}employees/${user.id}/reject/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to reject user");
      onSuccess?.(user.id, "Rejected");
      onClose();
    } catch (err) {
      alert(err.message || "Failed to reject user.");
    }
  };

  return (
    <>
      <h2>Reject User</h2>
      <p>
        Reject user <strong>{user.firstName} {user.lastName}</strong>?
      </p>
      <div className="modal-actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleReject}>Reject</button>
      </div>
    </>
  );
};

export default CoordinatorAdminRejectUserModal;
