import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './CoordinatorAdminTicketTracker.module.css';
import CoordinatorAdminOpenTicketModal from '../../components/modals/CoordinatorAdminOpenTicketModal';
import CoordinatorAdminRejectTicketModal from '../../components/modals/CoordinatorAdminRejectTicketModal';

const STATUS_COMPLETION = {
  1: ['New', 'Pending', 'Open', 'In Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
  2: ['Pending', 'Open', 'In Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
  3: ['Open', 'In Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
  4: ['In Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
  5: ['Resolved', 'Closed', 'Rejected', 'Withdrawn'],
};

const getStatusSteps = (status) =>
  [1, 2, 3, 4, 5].map((id) => ({
    id,
    completed: STATUS_COMPLETION[id].includes(status),
  }));

const DetailField = ({ label, value }) => (
  <fieldset>
    <label>{label}</label>
    <p>{value || 'N/A'}</p>
  </fieldset>
);

const formatDate = (date) =>
  date ? new Date(date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

export default function CoordinatorAdminTicketTracker() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const token =
          localStorage.getItem('admin_access_token') ||
          localStorage.getItem('coordinator_access_token');
        const res = await fetch(`${API_URL}tickets/${ticketNumber}/`, {
          headers:
            { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTicket(data);
        } else {
          setTicket(null);
        }
      } catch {
        setTicket(null);
      }
      setLoading(false);
    };
    if (ticketId) fetchTicket();
  }, [ticketId]);

  if (loading) return <p>Loading...</p>;
  if (!ticket) return <p className={styles.notFound}>Ticket #{ticketId} not found.</p>;

  const {
    ticket_number,
    subject,
    category,
    sub_category,
    status,
    submit_date,
    update_date,
    description,
    attachments,
    priority,
    department,
    assigned_to,
    scheduled_date,
    employee,
  } = ticket;

  const statusSteps = getStatusSteps(status);

  return (
    <>
      <main className={styles.coordinatorTicketTrackerPage}>
        <div className={styles.mainContent}>
          <section className={styles.ticketCard}>
            <header className={styles.header}>
              <div>
                <h2 className={styles.heading}>#{ticket_number || ticketId}</h2>
                <p className={styles.subheading}>{subject || 'No subject provided'}</p>
              </div>
              <div className={styles.statusBadge}>
                <span className={styles.statusDot}></span>
                <span className={styles.statusText}>{status}</span>
              </div>
            </header>

            <div className={styles.timestamp}>Created at: {formatDate(submit_date)}</div>

            <div className={styles.ticketInfo}>
              <DetailField label="Priority" value={priority} />
              <DetailField label="Department" value={department} />
              <DetailField label="Assigned Agent" value={assigned_to?.first_name ? `${assigned_to.first_name} ${assigned_to.last_name}` : assigned_to || "Unassigned"} />
              <DetailField label="Scheduled Request" value={scheduled_date} />
              <DetailField label="Date Created" value={formatDate(submit_date)} />
              <DetailField label="Last Updated" value={formatDate(update_date)} />
              <DetailField label="Category" value={category} />
              <DetailField label="Sub-Category" value={sub_category} />
              <DetailField label="Employee" value={employee ? `${employee.first_name} ${employee.last_name}` : "N/A"} />
              <DetailField label="Employee Department" value={employee?.department} />
              <DetailField label="Employee Email" value={employee?.email} />
            </div>

            <section className={styles.descriptionBlock}>
              <h3 className={styles.descriptionTitle}>Description</h3>
              <p className={styles.descriptionBox}>{description || 'No description provided.'}</p>
            </section>

            <section className={styles.attachment}>
              <h3 className={styles.descriptionTitle}>
                Attachment{attachments && attachments.length > 1 ? 's' : ''}
              </h3>
              <div className={styles.attachmentContent}>
                <span className={styles.attachmentIcon}>📎</span>
                {attachments && attachments.length > 0 ? (
                  attachments.map((file, idx) => {
                    const isDownloadOnly = /\.(docx|xlsx|csv)$/i.test(file.file_name);
                    return (
                      <a
                        key={file.id || idx}
                        href={file.file}
                        {...(isDownloadOnly
                          ? { download: file.file_name }
                          : { target: "_blank", rel: "noopener noreferrer", download: file.file_name })}
                        className={styles.attachmentText}
                        style={{ display: "block" }}
                      >
                        {file.file_name}
                      </a>
                    );
                  })
                ) : (
                  <span className={styles.attachmentText}>No file attached.</span>
                )}
              </div>
            </section>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.statusSection}>
            {status === 'New' && (
              <div className={styles.actionButtons}>
                <button
                  className={styles.rejectButton}
                  onClick={() => setShowRejectModal(true)}
                >
                  Reject Ticket
                </button>
                <button
                  className={styles.approveButton}
                  onClick={() => setShowOpenModal(true)}
                >
                  Open Ticket
                </button>
              </div>
            )}

            <h3 className={styles.statusTitle}>Status</h3>
            <div className={styles.statusTimeline}>
              {statusSteps.map((step, index) => (
                <div key={step.id} className={styles.statusStep}>
                  <div className={`${styles.statusCircle} ${step.completed ? styles.completed : ''}`}>
                    {step.completed && <span className={styles.checkmark}>✓</span>}
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`${styles.statusLine} ${
                        step.completed ? styles.completedLine : ''
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className={styles.currentStatus}>
              <h4 className={styles.currentStatusTitle}>Current Status</h4>
              <p className={styles.currentStatusText}>{status}</p>
            </div>
          </div>
        </aside>
      </main>

      {showOpenModal && (
        <CoordinatorAdminOpenTicketModal
          ticket={ticket}
          onClose={() => setShowOpenModal(false)}
        />
      )}
      {showRejectModal && (
        <CoordinatorAdminRejectTicketModal
          ticket={ticket}
          onClose={() => setShowRejectModal(false)}
        />
      )}
    </>
  );
}
