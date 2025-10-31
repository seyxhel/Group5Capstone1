import { useState, useRef, useEffect } from 'react';
import useScrollShrink from '../../../shared/hooks/useScrollShrink.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import CoordinatorAdminNotifications from '../pop-ups/CoordinatorAdminNotifications';
import styles from './CoordinatorAdminNavigationBar.module.css';
import MapLogo from '../../../shared/assets/MapLogo.png';
import authService from '../../../utilities/service/authService';
import { backendEmployeeService } from '../../../services/backend/employeeService';
import { API_CONFIG } from '../../../config/environment';
import { useAuth } from '../../../context/AuthContext';

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
  const { user: currentUser } = useAuth();
  const FALLBACK_SVG = 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg';

  // Use image directly from context user data
  const profileImageUrl = currentUser?.profile_picture || FALLBACK_SVG;

  const [openDropdown, setOpenDropdown] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // temporarily set threshold to 0 and enable debug to observe scroll events during testing
  const scrolled = useScrollShrink(0, { debug: true });

  const toggleDropdown = (key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const handleNavigate = (path) => {
    navigate(path);
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    // Clear all auth-related localStorage items
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('user');
    localStorage.removeItem('chatbotMessages');
    
    setIsMobileMenuOpen(false);
    // Navigate to login and pass a flag so the login page can show a brief
    // loading state after logout. Avoid forcing a full page reload.
    navigate('/', { state: { fromLogout: true } });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Build nav sections based on current user role
  const role = currentUser?.role;

  const ticketsSection = {
    key: 'tickets',
    label: 'Ticket Management',
    basePath: '/admin/ticket-management',
    links: [
      { label: 'All Tickets', path: '/admin/ticket-management/all-tickets' },
      { label: 'New Tickets', path: '/admin/ticket-management/new-tickets' },
      { label: 'Pending Tickets', path: '/admin/ticket-management/pending-tickets' },
      { label: 'Open Tickets', path: '/admin/ticket-management/open-tickets' },
      { label: 'In Progress Tickets', path: '/admin/ticket-management/in-progress-tickets' },
      { label: 'On Hold Tickets', path: '/admin/ticket-management/on-hold-tickets' },
      { label: 'Withdrawn Tickets', path: '/admin/ticket-management/withdrawn-tickets' },
      { label: 'Closed Tickets', path: '/admin/ticket-management/closed-tickets' },
      { label: 'Rejected Tickets', path: '/admin/ticket-management/rejected-tickets' }
    ]
  };

  const usersSection = {
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
  };

  const reportsSection = {
    key: 'reports',
    label: 'Reports',
    basePath: '/admin/reports',
    links: [
      { label: 'Ticket Reports', path: '/admin/reports/tickets' },
      { label: 'SLA Compliance', path: '/admin/reports/sla' }
    ]
  };

  const kbSection = {
    key: 'kb',
    label: 'Knowledge Base',
    basePath: '/admin/knowledge',
    links: [
      { label: 'Articles', path: '/admin/knowledge/articles' },
      { label: 'Archived Articles', path: '/admin/knowledge/archived' }
    ]
  };

  // Role-based section composition
  let navSections = [];
  if (role === 'Ticket Coordinator') {
    // Ticket coordinator: Dashboard (tickets only), Ticket Management, Reports
    navSections = [ticketsSection, reportsSection];
  } else if (role === 'System Admin') {
    // System Admin: Dashboard (all), Ticket Management (view-only), User Access, Reports, KB
    navSections = [ticketsSection, usersSection, reportsSection, kbSection];
  } else {
    // Default: show everything
    navSections = [ticketsSection, usersSection, reportsSection, kbSection];
  }

  // If current user is a Ticket Coordinator, they should not see User Access
  const visibleNavSections = navSections.filter(s => {
    if (s.key === 'users' && currentUser?.role === 'Ticket Coordinator') return false;
    return true;
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
    // Close any open dropdowns when toggling mobile menu
    setOpenDropdown(null);
  };

  return (
    <nav className={`${styles['main-nav-bar']} ${scrolled ? styles.scrolled : ''}`} ref={navRef}>
      {/* Logo & Brand (Desktop: Left, Mobile: Right) */}
      <section className={styles['logo-placeholder']}>
        <img src={MapLogo} alt="SmartSupport Logo" className={styles['logo-image']} />
        <div className={styles['brand-wrapper']}>
          <span className={styles['brand-name']}>SmartSupport</span>
          <span className={styles['admin-badge']}>{currentUser?.role}</span>
        </div>
      </section>

      {/* Navigation Links (Desktop: Middle, Mobile: Sidebar) */}
      <section>
        <ul className={`${styles['nav-list']} ${isMobileMenuOpen ? styles.open : ''}`}>
          {/* Mobile Profile Section - Shows at top of mobile menu */}
          <li className={styles['mobile-profile-section']}>
            <div className={styles['profile-avatar-large']}>
              <img 
                src={profileImageUrl} 
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_SVG; }}
                alt="Profile" 
                className={styles['avatar-image']} 
              />
            </div>
            <div className={styles['mobile-profile-info']}>
              <h3>{`${currentUser?.first_name} ${currentUser?.last_name}`}</h3>
              <span className={styles['admin-badge']}>{currentUser?.role}</span>
              <div className={styles['mobile-profile-actions']}>
                <button 
                  className={styles['mobile-settings-btn']}
                  onClick={() => handleNavigate('/admin/settings')}
                >
                  Settings
                </button>
                <button
                  className={styles['mobile-logout-btn']}
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
            </div>
          </li>

          {/* Dashboard Link */}
          <li className={styles['nav-item']}>
            <button
              className={`${styles['nav-link']} ${location.pathname === '/admin/dashboard' ? styles.clicked : ''}`}
              onClick={() => handleNavigate('/admin/dashboard')}
            >
              Dashboard
            </button>
          </li>

          {/* Navigation Sections with Dropdowns */}
          {visibleNavSections.map(({ key, label, links, basePath }) => {
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

      {/* Right Section: Notifications & Profile (Desktop Only) */}
      <section className={styles['nav-right-section']}>
        {/* Hamburger on the right for mobile */}
        <button
          className={`${styles.hamburgerBtn} ${isMobileMenuOpen ? styles.open : ''}`}
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

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
            {notifCount > 0 && (
              <span className={styles['notification-badge']}>{notifCount}</span>
            )}
          </div>
          {openDropdown === 'notifications' && (
            <CoordinatorAdminNotifications
              show={openDropdown === 'notifications'}
              onClose={() => setOpenDropdown(null)}
              onCountChange={setNotifCount}
            />
          )}
        </div>

        <div className={styles['profile-container']}>
          <div className={styles['profile-avatar']} onClick={() => toggleDropdown('profile')}>
            <img src={profileImageUrl} alt="Profile" className={styles['avatar-image']} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_SVG; }} />
          </div>
          {openDropdown === 'profile' && (
            <div className={styles['profile-dropdown']}>
              <div className={styles['profile-header']}>
                <div className={styles['profile-avatar-large']}>
                  <img src={profileImageUrl} alt="Profile" className={styles['avatar-image']} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_SVG; }} />
                </div>
                <div className={styles['profile-info']}>
                  <h3>{`${currentUser?.first_name} ${currentUser?.last_name}`}</h3>
                  <span className={styles['admin-badge']}>{currentUser?.role}</span>
                </div>
              </div>
              <div className={styles['profile-menu']}>
                <button onClick={() => handleNavigate('/admin/settings')}>Settings</button>
                <button className={styles['logout-btn']} onClick={handleLogout}>Log Out</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </nav>
  );
};

export default CoordinatorAdminNavBar;