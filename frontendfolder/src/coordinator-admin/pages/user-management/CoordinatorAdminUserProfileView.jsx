import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ViewCard from '../../../shared/components/ViewCard';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import Skeleton from '../../../shared/components/Skeleton/Skeleton';
import styles from './CoordinatorAdminUserProfileView.module.css';
import { getEmployeeUsers, getEmployeeUserById } from '../../../utilities/storages/employeeUserStorage';
import { backendEmployeeService } from '../../../services/backend/employeeService';

export default function CoordinatorAdminUserProfileView() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }
      // try to resolve by numeric id first then fallback to companyId search
      const numeric = Number(companyId);
      let found = null;
      if (!Number.isNaN(numeric)) {
        // Try local storage first
        found = getEmployeeUserById(numeric);
        // If not found locally, try fetching from backend by id
        if (!found) {
          backendEmployeeService.getEmployeeById(numeric).then(emp => {
            if (emp) setUser(normalizeEmployee(emp));
          }).catch(() => {});
        }
      }
      if (!found) {
        const all = getEmployeeUsers();
        found = all.find(u => String(u.companyId) === String(companyId) || String(u.id) === String(companyId));
      }

      // If still not found locally and companyId is non-numeric, try fetching all employees and match by company id
      if (!found) {
        (async () => {
          try {
            const emps = await backendEmployeeService.getAllEmployees();
            if (Array.isArray(emps) && emps.length > 0) {
              const match = emps.find(e => String(e.company_id || e.companyId || e.companyIdNumber || e.companyId) === String(companyId) || String(e.id) === String(companyId));
              if (match) {
                setUser(normalizeEmployee(match));
                setIsLoading(false);
                return;
              }
            }
          } catch (e) {
            // ignore backend errors and fall through to not found
          }
          // final fallback to the previously found local value (may be null)
          setUser(found ? normalizeEmployee(found) : null);
          setIsLoading(false);
        })();
        return;
      }

      setUser(found ? normalizeEmployee(found) : null);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [companyId]);

  // Normalize employee object shape from backend (snake_case) or local storage to the
  // frontend shape expected by this component (camelCase keys like firstName, lastName, profileImage)
  const normalizeEmployee = (e) => {
    if (!e) return null;
    // If already appears normalized (has firstName), return as-is
    if (e.firstName) return e;
    return {
      id: e.id || e.pk || e.employee_id || null,
      companyId: e.company_id || e.companyId || e.companyIdNumber || e.companyId || e.company_id_number || '',
      firstName: e.first_name || e.firstName || e.first || '',
      lastName: e.last_name || e.lastName || e.last || '',
      email: e.email || e.email_address || '',
      role: e.role || e.user_role || '',
      department: e.department || e.dept || '',
      profileImage: e.profile_image || e.profileImage || e.image || '',
      status: e.status || e.account_status || '',
      phone: e.phone || e.contact_number || '',
    };
  };

  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Fetch activity logs from backend when user changes
  useEffect(() => {
    let mounted = true;
    if (!user?.id) {
      setActivityLogs([]);
      setLogsLoading(false);
      return;
    }
    setLogsLoading(true);
    (async () => {
      try {
        const logs = await backendEmployeeService.getActivityLogs(user.id);
        if (!mounted) return;
        setActivityLogs(Array.isArray(logs) ? logs : []);
      } catch (e) {
        console.error('Failed to fetch activity logs', e);
        if (mounted) setActivityLogs([]);
      } finally {
        if (mounted) setLogsLoading(false);
      }
    })();
    return () => { mounted = false; };
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
        {isLoading ? (
          <div className={styles.container}>
            <Skeleton width="300px" height="24px" />
            <div style={{ marginTop: '24px' }}>
              <Skeleton width="100px" height="100px" borderRadius="6px" />
              <Skeleton width="200px" height="20px" style={{ marginTop: '12px' }} />
              <Skeleton width="150px" height="16px" style={{ marginTop: '8px' }} />
              <Skeleton width="150px" height="16px" style={{ marginTop: '8px' }} />
            </div>
            <div style={{ marginTop: '24px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <Skeleton width="100px" height="14px" />
                  <Skeleton width="100%" height="20px" style={{ marginTop: '4px' }} />
                </div>
              ))}
            </div>
          </div>
        ) : !user ? (
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
                  {logsLoading ? (
                    <div className={styles.emptyState}><p>Loading activity logs…</p></div>
                  ) : activityLogs.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>No activity recorded for this user</p>
                    </div>
                  ) : (
                    <div className={styles.activityList}>
                      {activityLogs.map((log) => (
                        <div key={log.id} className={styles.activityItem}>
                          <div className={styles.activityTime}>{formatTimestamp(log.timestamp)}</div>
                          <div className={styles.activityContent}>
                            <div className={styles.activityAction}>{(log.action_type || '').replace(/_/g, ' ').toUpperCase()}</div>
                            <div className={styles.activityDetails}>{log.message || log.details}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
      </ViewCard>
    </main>
  );
}
