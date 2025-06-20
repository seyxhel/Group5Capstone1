import { useState } from 'react';
import styles from './CoordinatorAdminNavigationBar.module.css';

const CoordinatorAdminNavBar = () => {
  const [showTicketMenu, setShowTicketMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showReportsMenu, setShowReportsMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
            <a href="#" className={styles['nav-link']}>Dashboard</a>
          </li>

          <li className={`${styles['dropdown-container']} ${styles['tickets-dropdown-container']} ${showTicketMenu ? styles['open'] : ''}`}>
            <div className={styles['dropdown-trigger']} onClick={() => setShowTicketMenu(!showTicketMenu)}>
              <span className={styles['dropdown-text']}>Ticket Management</span>
              <ArrowDownIcon />
            </div>
            {showTicketMenu && (
              <div className={`${styles['custom-dropdown']} ${styles['tickets-dropdown']}`}>
                <div className={styles['dropdown-menu']}>
                  <button>All Tickets</button>
                  <button>New Tickets</button>
                  <button>Pending Tickets</button>
                  <button>Open Tickets</button>
                  <button>On Progress Tickets</button>
                  <button>On Hold Tickets</button>
                  <button>Resolved Tickets</button>
                  <button>Closed Tickets</button>
                  <button>Rejected Tickets</button>
                  <button>Withdrawn Tickets</button>
                </div>
              </div>
            )}
          </li>

          <li className={`${styles['dropdown-container']} ${styles['users-dropdown-container']} ${showUserMenu ? styles['open'] : ''}`}>
            <div className={styles['dropdown-trigger']} onClick={() => setShowUserMenu(!showUserMenu)}>
              <span className={styles['dropdown-text']}>User Management</span>
              <ArrowDownIcon />
            </div>
            {showUserMenu && (
              <div className={`${styles['custom-dropdown']} ${styles['users-dropdown']}`}>
                <div className={styles['dropdown-menu']}>
                  <button>All Users</button>
                  <button>Employees</button>
                  <button>Ticket Coordinators</button>
                  <button>System Admins</button>
                  <button>Pending Users</button>
                  <button>Rejected Users</button>
                </div>
              </div>
            )}
          </li>

          <li className={`${styles['dropdown-container']} ${styles['reports-dropdown-container']} ${showReportsMenu ? styles['open'] : ''}`}>
            <div className={styles['dropdown-trigger']} onClick={() => setShowReportsMenu(!showReportsMenu)}>
              <span className={styles['dropdown-text']}>Reports</span>
              <ArrowDownIcon />
            </div>
            {showReportsMenu && (
              <div className={`${styles['custom-dropdown']} ${styles['reports-dropdown']}`}>
                <div className={styles['dropdown-menu']}>
                  <button>Department Reports</button>
                  <button>Coordinator Reports</button>
                  <button>Ticket Statistics</button>
                </div>
              </div>
            )}
          </li>
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
                <div className={styles['notification-item']}><p>User approval pending</p><span>1 hour ago</span></div>
                <div className={styles['notification-item']}><p>System maintenance scheduled</p><span>3 hours ago</span></div>
              </div>
            </div>
          )}
        </div>

        <div className={styles['profile-container']}>
          <div className={styles['profile-avatar']} onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className={styles['avatar-placeholder']}>MP</div>
          </div>
          {showProfileMenu && (
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
                <button>Settings</button>
                <button>User Management</button>
                <button className={styles['logout-btn']}>Log Out</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </nav>
  );
};

export default CoordinatorAdminNavBar;
