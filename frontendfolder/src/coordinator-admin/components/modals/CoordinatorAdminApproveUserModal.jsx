// CoordinatorAdminApproveUserModal.jsx
import ModalWrapper from "../../../shared/modals/ModalWrapper";

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const CoordinatorAdminApproveUserModal = ({ user, onClose, onSuccess }) => {
  const handleApprove = async () => {
    try {
      const token = localStorage.getItem("admin_access_token");
      const res = await fetch(`${API_URL}employees/${user.id}/approve/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to approve user");
      onSuccess?.(user.id, "Approved");
      onClose();
    } catch (err) {
      alert(err.message || "Failed to approve user.");
    }
  };

  return (
      <>
      <h2>Approve User</h2>
      <p>
        Approve user <strong>{user.firstName} {user.lastName}</strong>?
      </p>
      <div className="modal-actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleApprove}>Approve</button>
      </div>
    </>
  );
};

export default CoordinatorAdminApproveUserModal;
