import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ViewCard from '../../../shared/components/ViewCard';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import styles from './CoordinatorAdminUserProfileView.module.css';
import { getEmployeeUsers, getEmployeeUserById } from '../../../utilities/storages/employeeUserStorage';
import { getUserActivityLogs } from '../../../utilities/storages/userActivityLog';

export default function CoordinatorAdminUserProfileView() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      // try numeric id lookup in local storage first
      const numeric = Number(companyId);
      let found = null;
      if (!Number.isNaN(numeric)) {
        found = getEmployeeUserById(numeric);
      }

      // Try backend list lookup by company_id
      try {
        const list = await backendEmployeeService.getAllEmployees().catch(() => null);
        if (Array.isArray(list) && list.length) {
          const matched = list.find((e) => String(e.company_id) === String(companyId) || String(e.companyId) === String(companyId));
          if (matched) {
            // normalize to the local fixture shape
            found = {
              id: matched.id,
              companyId: matched.company_id || matched.companyId,
              firstName: matched.first_name || matched.firstName || '',
              lastName: matched.last_name || matched.lastName || '',
              department: matched.department || matched.dept || '',
              role: matched.role || 'Employee',
              status: matched.status || 'Active',
              email: matched.email || null,
              phone: matched.phone || matched.mobile || null,
              profileImage: convertToSecureUrl(matched.image) || matched.image || null,
            };
          }
        }
      } catch (e) {
        // ignore backend fetch errors
      }

      if (!found) {
        const all = getEmployeeUsers();
        found = all.find((u) => String(u.companyId) === String(companyId) || String(u.id) === String(companyId));
      }

      setUser(found || null);
    })();
  }, [companyId]);

  // Get activity logs for this user
  const activityLogs = useMemo(() => {
    if (!user?.id) return [];
    return getUserActivityLogs(user.id);
  }, [user?.id]);

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

  return (
    <main className={styles.pageRoot}>
      <Breadcrumb
        root="User Management"
        currentPage="User Profile"
        rootNavigatePage="/admin/user-management/all"
        title={user ? `${user.firstName} ${user.lastName}` : 'User Profile'}
      />

      <ViewCard>
        <div className={styles.container}>
          {!user ? (
            <div className={styles.notFound}>No user found for ID <strong>{companyId}</strong>.</div>
          ) : (
            <>
              <h2 className={styles.title}>{user.firstName} {user.lastName}</h2>

              <div className={styles.contentWrapper}>
                {/* Profile Section */}
                <div className={styles.profileSection}>
                  <div className={styles.profileHeader}>
                    <div className={styles.avatarContainer}>
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>{user.firstName?.charAt(0) || 'U'}</div>
                      )}
                    </div>
                    <div className={styles.profileInfo}>
                      <h3 className={styles.userName}>{user.firstName} {user.lastName}</h3>
                      <p className={styles.role}>{user.role}</p>
                      <p className={styles.department}>{user.department}</p>
                    </div>
                  </div>

                  <div className={styles.profileDetails}>
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailField}>
                        <span className={styles.detailLabel}>Company ID</span>
                        <span className={styles.detailValue}>{user.companyId}</span>
                      </div>
                      <div className={styles.detailField}>
                        <span className={styles.detailLabel}>Employee ID</span>
                        <span className={styles.detailValue}>{user.id}</span>
                      </div>
                      <div className={styles.detailField}>
                        <span className={styles.detailLabel}>Status</span>
                        <span className={`${styles.detailValue} ${styles[`status-${user.status?.toLowerCase()}`]}`}>{user.status}</span>
                      </div>
                      <div className={styles.detailField}>
                        <span className={styles.detailLabel}>Email</span>
                        <span className={styles.detailValue}>{user.email || '—'}</span>
                      </div>
                      <div className={styles.detailField}>
                        <span className={styles.detailLabel}>Phone</span>
                        <span className={styles.detailValue}>{user.phone || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Logs Section */}
                <div className={styles.activitySection}>
                  <h3 className={styles.activityTitle}>Activity Logs</h3>
                  {activityLogs.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>No activity recorded for this user</p>
                    </div>
                  ) : (
                    <div className={styles.activityList}>
                      {activityLogs.map((log) => (
                        <div key={log.id} className={styles.activityItem}>
                          <div className={styles.activityTime}>{formatTimestamp(log.timestamp)}</div>
                          <div className={styles.activityContent}>
                            <div className={styles.activityAction}>{log.action?.replace(/_/g, ' ').toUpperCase()}</div>
                            <div className={styles.activityDetails}>{log.details}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </ViewCard>
    </main>
  );
}
