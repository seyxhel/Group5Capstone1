const EmployeeNotification = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '40px',
        right: '0',
        width: '260px',
        background: 'white',
        border: '1px solid #eee',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '12px',
        zIndex: 1000,
      }}
      // Optional: close dropdown when clicking outside or add a close button
      onClick={onClose}
    >
      <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Notifications</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px' }}>New ticket submitted</p>
          <span style={{ fontSize: '11px', color: '#555' }}>2 minutes ago</span>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px' }}>Ticket updated</p>
          <span style={{ fontSize: '11px', color: '#555' }}>1 hour ago</span>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px' }}>Support replied</p>
          <span style={{ fontSize: '11px', color: '#555' }}>3 hours ago</span>
        </div>
      </div>
    </div>
  );
};

export default EmployeeNotification;
