// CoordinatorAdminRejectUserModal.jsx
import ModalWrapper from "../../../shared/modals/ModalWrapper";

const CoordinatorAdminRejectUserModal = ({ user, onClose }) => {
  const handleReject = () => {
    // Simulate API call or update logic here
    alert(`User ${user.firstName} ${user.lastName} rejected.`);
    onClose();
  };

  return (
    <ModalWrapper onClose={onClose}>
      <h2>Reject User</h2>
      <p>
        Reject user <strong>{user.firstName} {user.lastName}</strong>?
      </p>

      <div className="modal-actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleReject}>Reject</button>
      </div>
    </ModalWrapper>
  );
};

export default CoordinatorAdminRejectUserModal;
