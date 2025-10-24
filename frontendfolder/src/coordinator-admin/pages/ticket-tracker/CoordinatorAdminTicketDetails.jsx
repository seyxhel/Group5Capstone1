import React from 'react';
import baseStyles from '../../../employee/pages/ticket-tracker/EmployeeTicketTracker.module.css';
import styles from './CoordinatorAdminTicketDetails.module.css';
import { getEmployeeUserById } from '../../../utilities/storages/employeeUserStorage';

const DEFAULT_AVATAR = '/public/default-profile.png';

function PersonCard({ name, metaLines = [], image }) {
  return (
    <div className={styles.personCard}>
      <div className={styles.avatarWrap}>
        <img src={image || DEFAULT_AVATAR} alt={name || 'Profile'} className={styles.avatarImage} />
      </div>
      <div className={styles.personInfo}>
        <div className={styles.personName}>{name || '—'}</div>
        {metaLines.map((m, i) => (
          <div className={styles.personMeta} key={i}>{m}</div>
        ))}
      </div>
    </div>
  );
}

export default function CoordinatorAdminTicketDetails({ ticket, ticketLogs = [], canSeeCoordinatorReview, formatDate }) {
  // Try to resolve user profile images using the stored users fixture
  const employeeUser = ticket?.employeeId ? getEmployeeUserById(Number(ticket.employeeId)) : null;
  const employeeImage = employeeUser?.profileImage || ticket?.employeeProfileImage || DEFAULT_AVATAR;

  const coordinatorId = ticket?.coordinatorReview?.coordinatorId || ticket?.assignedTo || null;
  const coordinatorUser = coordinatorId ? getEmployeeUserById(Number(coordinatorId)) : null;
  const coordinatorImage = coordinatorUser?.profileImage || ticket?.coordinatorReview?.coordinatorProfileImage || DEFAULT_AVATAR;

  return (
    <div className={baseStyles.detailsGrid + ' ' + styles.detailsPanel + ' ' + styles.panelRoot}>
      <div className={styles.panelContent}>
      {/* Horizontal timeline bar above the sections */}
      <div className={styles.horizontalTimelineWrap}>
        <div className={styles.horizontalLine} />
        <div className={styles.horizontalDots}>
          {(() => {
            const steps = Math.max(5, ticketLogs?.length || 0);
            const activeIndex = Math.max(0, steps - 1);
            return Array.from({ length: steps }).map((_, i) => (
              <div key={i} className={`${styles.dot} ${i === activeIndex ? styles.activeDot : ''}`} />
            ));
          })()}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Employee</div>
        <div className={styles.userCardWrap}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>{/* emoji fallback for now */}
              <img src={employeeImage} alt={ticket?.employeeName || 'Employee'} className={styles.avatarImageInner} />
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{ticket?.employeeName || '—'}</div>
              <div className={styles.userMeta}>
                {ticket?.employeeDepartment || '—'}<br />
                Employee ID: {ticket?.employeeId || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Ticket Coordinator</div>
        <div className={styles.userCardWrap}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              <img src={coordinatorImage} alt={ticket?.coordinatorReview?.coordinatorName || 'Coordinator'} className={styles.avatarImageInner} />
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{ticket?.coordinatorReview?.coordinatorName || (coordinatorUser ? `${coordinatorUser.firstName} ${coordinatorUser.lastName}` : '—')}</div>
              <div className={styles.userMeta}>
                {coordinatorUser?.department || ticket?.department || '—'}<br />
                User ID: {coordinatorUser?.id || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Done removed — timeline displays activity and coordinator review appears under Coordinator section */}
      </div>
    </div>
  );
}
