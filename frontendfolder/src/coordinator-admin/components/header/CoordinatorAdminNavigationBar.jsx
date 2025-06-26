import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CoordinatorAdminNotifications, { notificationCount } from '../pop-ups/CoordinatorAdminNotifications';
import styles from './CoordinatorAdminNavigationBar.module.css';
import MapLogo from '../../../shared/assets/MapLogo.png';
import authService from '../../../utilities/service/authService';

const CoordinatorAdminNavBar = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (key) => {
    setOpenDropdown(prev => (prev === key ? null : key));
  };

  const ArrowDownIcon = ({ flipped }) => (
    <svg
      className={`${styles['arrow-icon']} ${flipped ? styles['arrow-flipped'] : ''}`}
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  const NotificationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className={styles['notif-icon']} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z"
        clipRule="evenodd"
      />
    </svg>
  );

  const navSections = [
    {
      key: 'tickets',
      label: 'Ticket Management',
      links: [
        { label: "All Tickets", path: "/admin/ticket-management/all-tickets" },
        { label: "New Tickets", path: "/admin/ticket-management/new-tickets" },
        { label: "Pending Tickets", path: "/admin/ticket-management/pending-tickets" },
        { label: "Open Tickets", path: "/admin/ticket-management/open-tickets" },
        { label: "On Progress Tickets", path: "/admin/ticket-management/on-progress-tickets" },
        { label: "On Hold Tickets", path: "/admin/ticket-management/on-hold-tickets" },
        { label: "Resolved Tickets", path: "/admin/ticket-management/resolved-tickets" },
        { label: "Closed Tickets", path: "/admin/ticket-management/closed-tickets" },
        { label: "Rejected Tickets", path: "/admin/ticket-management/rejected-tickets" },
        { label: "Withdrawn Tickets", path: "/admin/ticket-management/withdrawn-tickets" },
      ]
    },
    {
      key: 'users',
      label: 'User Access',
      links: [
        { label: "All Users", path: "/admin/users/all-users" },
        { label: "Employees", path: "/admin/users/employees" },
        { label: "Ticket Coordinators", path: "/admin/users/ticket-coordinators" },
        { label: "System Admins", path: "/admin/users/system-admins" },
        { label: "Pending Users", path: "/admin/users/pending-users" },
        { label: "Rejected Users", path: "/admin/users/rejected-users" },
      ]
    },
    {
      key: 'reports',
      label: 'Reports',
      links: [
        { label: "Department Reports", path: "/admin/reports/departments" },
        { label: "Coordinator Reports", path: "/admin/reports/coordinators" },
        { label: "Ticket Statistics", path: "/admin/reports/statistics" },
      ]
    }
  ];

  return (
    <nav className={styles['main-nav-bar']}>
      <section className={styles['logo-placeholder']}>
        <img src={MapLogo} alt="Map Logo" className={styles['logo-image']} />
        <div className={styles['brand-wrapper']}>
          <span className={styles['brand-name']}>MAP Support</span>
          <span className={styles['admin-badge']}>Admin</span>
        </div>
      </section>

      <section>
        <ul className={styles['nav-list']}>
          <li className={styles['nav-item']}>
            <button className={styles['nav-link']} onClick={() => navigate('/admin/dashboard')}>
              Dashboard
            </button>
          </li>

          {navSections.map(({ key, label, links }) => (
            <li key={key} className={`${styles['dropdown-container']} ${openDropdown === key ? styles['open'] : ''}`}>
              <div className={styles['dropdown-trigger']} onClick={() => toggleDropdown(key)}>
                <span className={styles['dropdown-text']}>{label}</span>
                <ArrowDownIcon flipped={openDropdown === key} />
              </div>
              {openDropdown === key && (
                <div className={styles['custom-dropdown']}>
                  <div className={styles['dropdown-menu']}>
                    <ul className={styles['dropdown-list']}>
                      {links.map(({ label, path }, i) => (
                        <li key={i}>
                          <button onClick={() => navigate(path)}>{label}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles['nav-right-section']}>
        <div className={styles['notification-icon-container']}>
          <div
            className={styles['notification-icon-wrapper']}
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown('notifications');
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') toggleDropdown('notifications');
            }}
          >
            <NotificationIcon />
            {notificationCount > 0 && (
              <span className={styles['notification-badge']}>{notificationCount}</span>
            )}
          </div>

          {openDropdown === 'notifications' && (
            <div className={styles['notification-popup-wrapper']}>
              <CoordinatorAdminNotifications />
            </div>
          )}
        </div>

        <div className={styles['profile-container']}>
          <div className={styles['profile-avatar']} onClick={() => toggleDropdown('profile')}>
            <div className={styles['avatar-placeholder']}>MP</div>
          </div>
          {openDropdown === 'profile' && (
            <div className={styles['profile-dropdown']}>
              <div className={styles['profile-header']}>
                <div className={styles['profile-avatar-large']}>
                  <div className={styles['avatar-placeholder']}>MP</div>
                </div>
                <div className={styles['profile-info']}>
                  <h3>Mary Grace Piattos</h3>
                  <span className={styles['admin-badge']}>Admin</span>
                </div>
              </div>
              <div className={styles['profile-menu']}>
                <button onClick={() => navigate('/admin/settings')}>Settings</button>
                <button className={styles['logout-btn']} onClick={() => {
                  authService.logoutAdmin();
                  navigate('/');
                }}>Log Out</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </nav>
  );
};

export default CoordinatorAdminNavBar;
