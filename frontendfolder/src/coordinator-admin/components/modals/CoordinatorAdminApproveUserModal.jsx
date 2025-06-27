// CoordinatorAdminApproveUserModal.jsx
import ModalWrapper from "../../../shared/modals/ModalWrapper";

const CoordinatorAdminApproveUserModal = ({ user, onClose }) => {
  const handleApprove = () => {
    // Simulate approval logic here
    alert(`User ${user.firstName} ${user.lastName} approved.`);
    onClose();
  };

  return (
    <ModalWrapper onClose={onClose}>
      <h2>Approve User</h2>
      <p>
        Approve user <strong>{user.firstName} {user.lastName}</strong>?
      </p>

      <div className="modal-actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleApprove}>Approve</button>
      </div>
    </ModalWrapper>
  );
};

export default CoordinatorAdminApproveUserModal;
