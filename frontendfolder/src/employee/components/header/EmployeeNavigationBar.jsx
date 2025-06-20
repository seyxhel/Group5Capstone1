import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './EmployeeNavigationBar.module.css';

const EmployeeNavBar = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleDropdown = (key) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

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

  const ArrowDownIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

  const renderDropdownMenu = (key) => {
    const dropdown = dropdowns[key];
    return (
      <li className={`${styles['dropdown-container']} ${openDropdown === key ? styles['open'] : ''}`}>
        <div className={styles['dropdown-trigger']} onClick={() => toggleDropdown(key)}>
          <span className={styles['dropdown-text']}>{dropdown.label}</span>
          <ArrowDownIcon />
        </div>
        {openDropdown === key && (
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
          <div className={styles['logo-box']}>LOGO</div>
          <div className={styles['brand-name']}>Brand Name</div>
        </div>
      </section>

      <section>
        <ul className={styles['nav-list']}>
          <li className={styles['nav-item']}>
            <NavLink to="/employee/home" className={styles['nav-link']}>
              Home
            </NavLink>
          </li>
          {renderDropdownMenu('active')}
          {renderDropdownMenu('records')}
        </ul>
      </section>

      <section>
        <div className={styles['notification-icon-container']}>
          <div className={styles['notification-icon-wrapper']} onClick={() => setShowNotifications(!showNotifications)}>
            <NotificationIcon />
            <span className={styles['notification-badge']}>4</span>
          </div>
          {showNotifications && (
            <div className={styles['notification-dropdown']}>
              <div className={styles['notification-header']}><h4>Notifications</h4></div>
              <div className={styles['notification-list']}>
                <div className={styles['notification-item']}><p>New ticket submitted</p><span>2 minutes ago</span></div>
                <div className={styles['notification-item']}><p>Ticket updated</p><span>1 hour ago</span></div>
                <div className={styles['notification-item']}><p>Support replied</p><span>3 hours ago</span></div>
              </div>
            </div>
          )}
        </div>

        <div className={styles['profile-container']}>
          <div className={styles['profile-avatar']} onClick={() => setShowProfileMenu(!showProfileMenu)}>
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
                <button>Settings</button>
                <button>My Tickets</button>
                <button className={styles['logout-btn']}>Log Out</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </nav>
  );
};

export default EmployeeNavBar;
