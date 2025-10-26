import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ViewCard from '../../../shared/components/ViewCard';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import styles from './CoordinatorAdminUserProfileView.module.css';
import { getEmployeeUsers, getEmployeeUserById } from '../../../utilities/storages/employeeUserStorage';
import { backendEmployeeService } from '../../../services/backend/employeeService';
import { convertToSecureUrl } from '../../../utilities/secureMedia';

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
          <div className={styles.headerRow}>
            <h2 className={styles.title}>{user ? `${user.firstName} ${user.lastName}` : 'User not found'}</h2>
            <div>
              <button className={styles.backButton} onClick={() => navigate(-1)}>Back</button>
            </div>
          </div>

          {!user ? (
            <div className={styles.notFound}>No user found for ID <strong>{companyId}</strong>.</div>
          ) : (
            <div className={styles.profileGrid}>
              <div className={styles.leftCol}>
                <div className={styles.avatarWrap}>
                  {user.profileImage ? (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>{user.firstName?.charAt(0) || 'U'}</div>
                  )}
                </div>
              </div>
              <div className={styles.rightCol}>
                <div className={styles.field}><span className={styles.label}>Company ID</span><span className={styles.value}>{user.companyId}</span></div>
                <div className={styles.field}><span className={styles.label}>Name</span><span className={styles.value}>{user.firstName} {user.lastName}</span></div>
                <div className={styles.field}><span className={styles.label}>Role</span><span className={styles.value}>{user.role}</span></div>
                <div className={styles.field}><span className={styles.label}>Department</span><span className={styles.value}>{user.department}</span></div>
                <div className={styles.field}><span className={styles.label}>Status</span><span className={styles.value}>{user.status}</span></div>
                <div className={styles.field}><span className={styles.label}>Email</span><span className={styles.value}>{user.email || '—'}</span></div>
                <div className={styles.field}><span className={styles.label}>Phone</span><span className={styles.value}>{user.phone || '—'}</span></div>
              </div>
            </div>
          )}
        </div>
      </ViewCard>
    </main>
  );
}
