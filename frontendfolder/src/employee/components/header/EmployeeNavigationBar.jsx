import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import styles from './EmployeeNavigationBar.module.css';
import MapLogo from '../../../shared/assets/MapLogo.png';
import EmployeeNotification from '../popups/EmployeeNotification';

const NotificationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={styles['notif-icon']}
  >
    <path
      fillRule="evenodd"
      d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z"
      clipRule="evenodd"
    />
  </svg>
);

const EmployeeNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const dropdowns = {
    active: {
      label: 'Active Tickets',
      items: [
        ['all-active-tickets', 'All Active Tickets'],
        ['submitted-tickets', 'Submitted Tickets'],
        ['open-tickets', 'Open Tickets'],
        ['on-progress-tickets', 'On Progress Tickets'],
        ['on-hold-tickets', 'On Hold Tickets'],
        ['pending-tickets', 'Pending Tickets'],
        ['resolved-tickets', 'Resolved Tickets'],
      ],
      path: '/employee/active-tickets/',
    },
    records: {
      label: 'Ticket Records',
      items: [
        ['all-ticket-records', 'All Ticket Records'],
        ['closed-ticket-records', 'Closed Tickets'],
        ['rejected-ticket-records', 'Rejected Tickets'],
        ['withdrawn-ticket-records', 'Withdrawn Tickets'],
      ],
      path: '/employee/ticket-records/',
    },
  };

  const ArrowDownIcon = ({ isFlipped }) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`${styles['arrow-icon']} ${isFlipped ? styles['arrow-flipped'] : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  const handleDropdownToggle = (key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
    setShowProfileMenu(false);
    setShowNotification(false);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu((prev) => !prev);
    setOpenDropdown(null);
    setShowNotification(false);
  };

  const toggleNotification = () => {
    setShowNotification((prev) => !prev);
    setOpenDropdown(null);
    setShowProfileMenu(false);
  };

  const renderDropdownMenu = (key) => {
    const dropdown = dropdowns[key];
    const isInPath = dropdown.items.some(
      ([route]) => location.pathname === `${dropdown.path}${route}`
    );
    const isOpen = openDropdown === key;

    return (
      <li className={`${styles['dropdown-container']} ${isOpen ? styles['open'] : ''}`}>
        <div
          className={`${styles['dropdown-trigger']} ${isInPath || isOpen ? styles['active-link'] : ''}`}
          onClick={() => handleDropdownToggle(key)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDropdownToggle(key);
            }
          }}
        >
          <span className={styles['dropdown-text']}>{dropdown.label}</span>
          <ArrowDownIcon isFlipped={isOpen} />
        </div>
        {isOpen && (
          <div className={styles['custom-dropdown']}>
            <div className={styles['dropdown-menu']}>
              {dropdown.items.map(([route, label]) => (
                <button
                  key={route}
                  onClick={() => {
                    setOpenDropdown(null);
                    navigate(`${dropdown.path}${route}`);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </li>
    );
  };

  return (
    <nav className={styles['main-nav-bar']}>
      <section>
        <div className={styles['logo-placeholder']}>
          <img src={MapLogo} alt="Logo" className={styles['logo-image']} />
          <div className={styles['brand-wrapper']}>
            <span className={styles['brand-name']}>SmartSupport</span>
            <span className={styles['role-badge']}>Employee</span>
          </div>
        </div>
      </section>

      <section>
        <ul className={styles['nav-list']}>
          <li className={styles['nav-item']}>
            <NavLink
              to="/employee/home"
              className={({ isActive }) =>
                `${styles['nav-link']} ${isActive ? styles['active-link'] : ''}`
              }
            >
              Home
            </NavLink>
          </li>
          {renderDropdownMenu('active')} 
          {renderDropdownMenu('records')}
        </ul>
      </section>

      <section>
        <div className={styles['notification-icon-container']} style={{ position: 'relative' }}>
          <div
            className={styles['notification-icon-wrapper']}
            onClick={toggleNotification}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleNotification();
              }
            }}
          >
            <NotificationIcon />
            {notifCount > 0 && (
              <span className={styles['notification-badge']}>{notifCount}</span>
            )}
          </div>
          <EmployeeNotification
            show={showNotification}
            onClose={() => setShowNotification(false)}
            onCountChange={setNotifCount}
          />
        </div>

        <div className={styles['profile-container']}>
          <div
            className={styles['profile-avatar']}
            onClick={toggleProfileMenu}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleProfileMenu();
              }
            }}
          >
            <div className={styles['avatar-placeholder']}>JD</div>
          </div>
          {showProfileMenu && (
            <div className={styles['profile-dropdown']}>
              <div className={styles['profile-header']}>
                <div className={styles['profile-avatar-large']}>
                  <div className={styles['avatar-placeholder']}>JD</div>
                </div>
                <div className={styles['profile-info']}>
                  <h3>Juan Dela Cruz</h3>
                  <span className={styles['admin-badge']}>Employee</span>
                </div>
              </div>
              <div className={styles['profile-menu']}>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/employee/settings');
                  }}
                >
                  Settings
                </button>
                <button
                  className={styles['logout-btn']}
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/');
                  }}
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </nav>
  );
};

export default EmployeeNavBar;
