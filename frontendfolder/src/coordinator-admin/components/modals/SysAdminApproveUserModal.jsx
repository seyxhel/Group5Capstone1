// CoordinatorAdminApproveUserModal.jsx
import ModalWrapper from "../../../shared/modals/ModalWrapper";

const CoordinatorAdminApproveUserModal = ({ user, onClose }) => {
  const handleApprove = async () => {
    try {
      const { backendEmployeeService } = await import("../../../services/backend/employeeService");
      // Use the correct endpoint for approval
      const { API_CONFIG } = await import("../../../config/environment.js");
      const BASE_URL = API_CONFIG.BACKEND.BASE_URL;
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${BASE_URL}/api/employees/${user.id}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Failed to approve user');
      }
      alert(`User ${user.firstName} ${user.lastName} approved.`);
      onClose(true); // pass true to trigger refresh
    } catch (err) {
      alert("Failed to approve user: " + (err?.message || err));
    }
  };

  return (
    <>
      <h2 className="modal-title">Approve User</h2>
      <p className="modal-message">
        Approve user <strong>{user.firstName} {user.lastName}</strong>?
      </p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button className="modal-cancel" onClick={onClose}>Cancel</button>
        <button className="modal-approve" onClick={handleApprove}>Approve</button>
      </div>
    </>
  );
};

export default CoordinatorAdminApproveUserModal;
