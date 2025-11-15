import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import Skeleton from '../../../shared/components/Skeleton/Skeleton';
import ViewCard from '../../../shared/components/ViewCard';
import Tabs from '../../../shared/components/Tabs';
import Button from '../../../shared/components/Button';
import styles from './CoordinatorAdminUserProfileView.module.css';
import detailStyles from '../ticket-tracker/CoordinatorAdminTicketDetails.module.css';
import { getEmployeeUsers, getEmployeeUserById } from '../../../utilities/storages/employeeUserStorage';
import { getUserActivityLogs } from '../../../utilities/storages/userActivityLog';
import { FiUser, FiCheckCircle, FiClock } from 'react-icons/fi';

export default function CoordinatorAdminUserProfileView() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }
      const numeric = Number(companyId);
      let found = null;
      if (!Number.isNaN(numeric)) {
        found = getEmployeeUserById(numeric);
      }
      if (!found) {
        const all = getEmployeeUsers();
        found = all.find(u => String(u.companyId) === String(companyId) || String(u.id) === String(companyId));
      }
      setUser(found || null);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [companyId]);

  // Get activity logs for this user
  const activityLogs = useMemo(() => {
    if (!user?.id) return [];
    return getUserActivityLogs(user.id);
  }, [user?.id]);

  // Sync column heights
  useEffect(() => {
    const syncHeights = () => {
      const leftCol = leftColRef.current;
      const rightCol = rightColRef.current;
      if (leftCol && rightCol) {
        const leftHeight = leftCol.offsetHeight;
        const rightHeight = rightCol.offsetHeight;
        const maxHeight = Math.max(leftHeight, rightHeight);
        leftCol.style.minHeight = `${maxHeight}px`;
        rightCol.style.minHeight = `${maxHeight}px`;
      }
    };

    const observer = new MutationObserver(syncHeights);
    if (leftColRef.current) {
      observer.observe(leftColRef.current, { subtree: true, childList: true });
    }

    const resizeObserver = new ResizeObserver(syncHeights);
    if (leftColRef.current) resizeObserver.observe(leftColRef.current);
    if (rightColRef.current) resizeObserver.observe(rightColRef.current);

    const timeout = setTimeout(syncHeights, 100);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [user, activeTab]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogIcon = (action) => {
    const a = (action || '').toLowerCase();
    if (a.includes('resolved')) return <FiCheckCircle />;
    if (a.includes('closed')) return <FiClock />;
    return <FiUser />;
  };

  if (isLoading && !user) {
    return (
      <main className={styles.pageRoot}>
        <Breadcrumb
          root="User Management"
          currentPage="User Profile"
          rootNavigatePage="/admin/user-access/all"
          title="User Profile"
        />
        <ViewCard>
          <div className={styles.contentGrid}>
            <div className={styles.leftColumn}>
              <Skeleton width="100px" height="32px" />
              <Skeleton width="100%" height="200px" style={{ marginTop: '16px' }} />
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ marginTop: '16px' }}>
                  <Skeleton width="150px" height="20px" />
                  <Skeleton width="100%" height="24px" style={{ marginTop: '8px' }} />
                </div>
              ))}
            </div>
            <div className={styles.rightColumn}>
              <Skeleton width="100%" height="300px" />
            </div>
          </div>
        </ViewCard>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.pageRoot}>
        <Breadcrumb
          root="User Management"
          currentPage="User Profile"
          rootNavigatePage="/admin/user-access/all"
          title="User Profile"
        />
        <ViewCard>
          <div style={{ padding: '40px 28px', textAlign: 'center', color: '#6c757d' }}>
            No user found for ID <strong>{companyId}</strong>.
          </div>
        </ViewCard>
      </main>
    );
  }

  return (
    <main className={styles.pageRoot}>
      <Breadcrumb
        root="User Management"
        currentPage={`${user.firstName} ${user.lastName}`}
        rootNavigatePage="/admin/user-access/all"
        title={`${user.firstName} ${user.lastName}`}
      />

      <ViewCard>
        <div className={styles.contentGrid}>
          {/* Left Column */}
          <div className={styles.leftColumn} ref={leftColRef}>
            {/* Status Badge - Top Left */}
            <div className={styles.statusBadgeContainer}>
              <span className={`${styles.statusBadge} ${styles[`status${user.status?.replace(/\s+/g, '')}`]}`}>
                {user.status}
              </span>
            </div>

            {/* User Header with Profile Section */}
            <div className={styles.userHeader}>
              <div className={styles.profileSection}>
                <div className={styles.profileImageContainer}>
                  <img 
                    src={user.profileImage || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=667eea&color=fff&size=96`} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className={styles.avatar}
                  />
                </div>
                <div className={styles.profileInfo}>
                  <h1>{user.firstName} {user.lastName}</h1>
                  <p className={styles.email}>{user.email}</p>
                  <div className={styles.badges}>
                    <span className={styles.roleBadge}>{user.role}</span>
                    <span className={styles.deptBadge}>{user.department}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Details - Contact Information Only */}
            <div className={styles.detailsSection}>
              <h3 className={styles.sectionTitle}>Contact Information</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Phone</div>
                  <div className={styles.detailValue}>{user.phone || '—'}</div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Address</div>
                  <div className={styles.detailValue}>{user.address || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Edit Status & Activity Logs */}
          <div ref={rightColRef} className={styles.rightColumn}>
            {/* Edit Status Button */}
            <div className={styles.actionButtons}>
              <Button 
                variant="primary" 
                onClick={() => alert('Edit Status feature coming soon')}
              >
                Edit Status
              </Button>
            </div>

            {/* Activity Logs */}
            <Tabs
              tabs={[
                { label: 'Activity Logs', value: 'logs' }
              ]}
              active={activeTab}
              onChange={setActiveTab}
              className={`${styles.tabsContainer} ${detailStyles.tabsFill}`}
            >
              <div className={styles.panelRoot}>
                <div className={styles.panelContent}>
                  <div className={styles.logsPanel}>
                    {activityLogs && activityLogs.length > 0 ? (
                      activityLogs.map((log) => (
                        <div key={log.id} className={styles.logEntry}>
                          <div className={styles.logAvatar}>{getLogIcon(log.action)}</div>
                          <div className={styles.logBody}>
                            <div className={styles.logText}>
                              <strong className={styles.logUserLabel}>System</strong>
                              {': '}
                              {log.action?.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div className={styles.logTimestamp}>{formatTimestamp(log.timestamp)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noLogs}>No activity recorded for this user.</div>
                    )}
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </ViewCard>
    </main>
  );
}