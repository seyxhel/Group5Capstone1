import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CoordinatorAdminNotifications, { notificationCount } from '../pop-ups/CoordinatorAdminNotifications';
import styles from './CoordinatorAdminNavigationBar.module.css';
import MapLogo from '../../../shared/assets/MapLogo.png';
import systemAdminData from '../../../utilities/storages/systemAdminMarites';

const ArrowDownIcon = ({ flipped }) => (
  <svg
    className={`${styles['arrow-icon']} ${flipped ? styles['arrow-flipped'] : ''}`}
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--primary-color)"
    strokeWidth="2"
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

const CoordinatorAdminNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const handleNavigate = (path) => {
    navigate(path);
    setOpenDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navSections = [
    {
      key: 'tickets',
      label: 'Ticket Management',
      basePath: '/admin/ticket-management',
      links: [
        { label: 'All Tickets', path: '/admin/ticket-management/all-tickets' },
        { label: 'New Tickets', path: '/admin/ticket-management/new-tickets' },
        { label: 'Pending Tickets', path: '/admin/ticket-management/pending-tickets' },
        { label: 'Open Tickets', path: '/admin/ticket-management/open-tickets' },
        { label: 'On Progress Tickets', path: '/admin/ticket-management/on-progress-tickets' },
        { label: 'On Hold Tickets', path: '/admin/ticket-management/on-hold-tickets' },
        { label: 'Resolved Tickets', path: '/admin/ticket-management/resolved-tickets' },
        { label: 'Closed Tickets', path: '/admin/ticket-management/closed-tickets' },
        { label: 'Rejected Tickets', path: '/admin/ticket-management/rejected-tickets' },
        { label: 'Withdrawn Tickets', path: '/admin/ticket-management/withdrawn-tickets' }
      ]
    },
    {
      key: 'users',
      label: 'User Access',
      basePath: '/admin/user-access',
      links: [
        { label: 'All Users', path: '/admin/user-access/all-users' },
        { label: 'Employees', path: '/admin/user-access/employees' },
        { label: 'Ticket Coordinators', path: '/admin/user-access/ticket-coordinators' },
        { label: 'System Admins', path: '/admin/user-access/system-admins' },
        { label: 'Pending Users', path: '/admin/user-access/pending-users' },
        { label: 'Rejected Users', path: '/admin/user-access/rejected-users' }
      ]
    },
    {
      key: 'reports',
      label: 'Reports',
      basePath: '/admin/reports',
      links: [
        { label: 'Department Reports', path: '/admin/reports/departments' },
        { label: 'Coordinator Reports', path: '/admin/reports/coordinators' },
        { label: 'Ticket Statistics', path: '/admin/reports/statistics' }
      ]
    }
  ];

  return (
    <nav className={styles['main-nav-bar']} ref={navRef}>
      {/* Logo & Brand */}
      <section className={styles['logo-placeholder']}>
        <img src={MapLogo} alt="SmartSupport Logo" className={styles['logo-image']} />
        <div className={styles['brand-wrapper']}>
          <span className={styles['brand-name']}>SmartSupport</span>
          <span className={styles['admin-badge']}>{systemAdminData.role}</span>
        </div>
      </section>

      {/* Navigation Links */}
      <section>
        <ul className={styles['nav-list']}>
          <li className={styles['nav-item']}>
            <button
              className={`${styles['nav-link']} ${location.pathname === '/admin/dashboard' ? styles.clicked : ''}`}
              onClick={() => handleNavigate('/admin/dashboard')}
            >
              Dashboard
            </button>
          </li>

          {navSections.map(({ key, label, links, basePath }) => {
            const isActiveSection = location.pathname.startsWith(basePath);
            return (
              <li
                key={key}
                className={`${styles['dropdown-container']} ${openDropdown === key ? styles['open'] : ''}`}
              >
                <div
                  className={`${styles['dropdown-trigger']} ${isActiveSection ? styles.clicked : ''}`}
                  onClick={() => toggleDropdown(key)}
                >
                  <span className={styles['dropdown-text']}>{label}</span>
                  <ArrowDownIcon flipped={openDropdown === key} />
                </div>
                {openDropdown === key && (
                  <div className={styles['custom-dropdown']}>
                    <div className={styles['dropdown-menu']}>
                      {links.map(({ label, path }) => (
                        <button
                          key={path}
                          onClick={() => handleNavigate(path)}
                          className={location.pathname === path ? styles.clicked : ''}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Right Side: Notifications & Profile */}
      <section className={styles['nav-right-section']}>
        <div
          className={`${styles['notification-icon-container']} ${
            openDropdown === 'notifications' ? styles['open'] : ''
          }`}
        >
          <div
            className={styles['notification-icon-wrapper']}
            onClick={() => toggleDropdown('notifications')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => ['Enter', ' '].includes(e.key) && toggleDropdown('notifications')}
          >
            <NotificationIcon />
            {notificationCount > 0 && (
              <span className={styles['notification-badge']}>{notificationCount}</span>
            )}
          </div>
          {openDropdown === 'notifications' && (
            <div className={styles['notification-dropdown']}>
              <CoordinatorAdminNotifications />
            </div>
          )}
        </div>

        <div className={styles['profile-container']}>
          <div className={styles['profile-avatar']} onClick={() => toggleDropdown('profile')}>
            <img src={systemAdminData.profileImage} alt="Profile" className={styles['avatar-image']} />
          </div>
          {openDropdown === 'profile' && (
            <div className={styles['profile-dropdown']}>
              <div className={styles['profile-header']}>
                <div className={styles['profile-avatar-large']}>
                  <img src={systemAdminData.profileImage} alt="Profile" className={styles['avatar-image']} />
                </div>
                <div className={styles['profile-info']}>
                  <h3>{`${systemAdminData.firstName} ${systemAdminData.lastName}`}</h3>
                  <span className={styles['admin-badge']}>{systemAdminData.role}</span>
                </div>
              </div>
              <div className={styles['profile-menu']}>
                <button onClick={() => handleNavigate('/admin/settings')}>Settings</button>
                <button className={styles['logout-btn']} onClick={() => navigate('/')}>Log Out</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </nav>
  );
};

export default CoordinatorAdminNavBar;
