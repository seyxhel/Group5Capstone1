import { useState, useRef, useEffect } from 'react';
import useScrollShrink from '../../../shared/hooks/useScrollShrink.jsx';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import styles from './EmployeeNavigationBar.module.css';
import MapLogo from '../../../shared/assets/MapLogo.png';
import EmployeeNotification from '../popups/EmployeeNotification';
import authService from '../../../utilities/service/authService';
import { backendAuthService } from '../../../services/backend/authService';
import { backendEmployeeService } from '../../../services/backend/employeeService';
import { API_CONFIG } from '../../../config/environment';

// Fallback profile image
const DEFAULT_PROFILE_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23e0e0e0"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-size="40" fill="%23666"%3E?%3C/text%3E%3C/svg%3E';

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

const EmployeeNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const navRef = useRef(null);

  const [openDropdown, setOpenDropdown] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(DEFAULT_PROFILE_IMAGE);
  const [backendAvailable, setBackendAvailable] = useState(true); // Always assume backend is available
  const scrolled = useScrollShrink(0, { debug: true });

  // Fetch employee profile with image on mount
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const profile = await backendEmployeeService.getCurrentEmployee();
        console.log('Fetched employee profile:', profile);
        
        if (profile.image) {
          // Build the full image URL
          const BASE_URL = API_CONFIG.BACKEND.BASE_URL.replace(/\/$/, '');
          let imageUrl = profile.image;
          
          // If image is a relative path, prepend the base URL
          if (!imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
            imageUrl = `${BASE_URL}${imageUrl}`;
          }
          
          console.log('Profile image URL:', imageUrl);
          setProfileImageUrl(imageUrl);
        }
      } catch (error) {
        console.error('Failed to fetch profile image:', error);
        // Keep using the default image on error
      }
    };

    if (currentUser) {
      fetchProfileImage();
    }
  }, [currentUser]);

  const dropdowns = {
    active: {
      label: 'Active Tickets',
      items: [
        ['all-active-tickets', 'All Active Tickets'],
        ['pending-tickets', 'Pending Tickets'],
        ['in-progress-tickets', 'In Progress Tickets'],
        ['on-hold-tickets', 'On Hold Tickets'],
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

  const handleLogout = () => {
    // Clear all auth-related localStorage items
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('user');
    localStorage.removeItem('chatbotMessages');
    
    // Close any open menus
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
    
    // Navigate to login page and force reload to clear component state
    navigate('/');
    window.location.reload();
  };

  const getFullName = () => {
    if (!currentUser) return '';
    const firstName = currentUser.firstName || currentUser.first_name || '';
    const middleName = currentUser.middleName || currentUser.middle_name || '';
    const lastName = currentUser.lastName || currentUser.last_name || '';
    
    // Build full name with middle name only if it exists
    return `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`.trim();
  };

  const resolveUser = () => (authService.getCurrentUser ? authService.getCurrentUser() : null);

  const getProfileImageSrc = () => {
    const user = resolveUser();
    // support multiple possible keys used across the app
    const imgCandidate = user?.profile_image || user?.image || user?.profileImage || user?.profileImg || employeeBonjingData.profileImage;

    if (!imgCandidate) return employeeBonjingData.profileImage;

    // Track any created object URLs so we can revoke them on unmount
    if (!getProfileImageSrc._createdUrlsRef) getProfileImageSrc._createdUrlsRef = [];
    const createdUrlsRef = getProfileImageSrc._createdUrlsRef;

    // If it's a File or Blob (local file selected and stored), create an object URL
    try {
      if (typeof Blob !== 'undefined' && imgCandidate instanceof Blob) {
        const objUrl = URL.createObjectURL(imgCandidate);
        createdUrlsRef.push(objUrl);
        return objUrl;
      }
    } catch (err) {
      // ignore cross-realm errors
    }

    // If the stored value is an object with a url property (some services store this shape)
    if (typeof imgCandidate === 'object' && imgCandidate !== null) {
      const urlVal = imgCandidate.url || imgCandidate.image || imgCandidate.path;
      if (urlVal && typeof urlVal === 'string') {
        // if it is a data URL or absolute URL, use it
        if (urlVal.startsWith('data:') || urlVal.startsWith('http')) return urlVal;
        // otherwise build absolute media URL
        const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || `${API_CONFIG.BACKEND.BASE_URL.replace(/\/$/, '')}/media/`;
        const clean = urlVal.startsWith('/') ? urlVal.slice(1) : urlVal;
        return `${MEDIA_URL}${clean}`;
      }
    }

  // If it's a data URL, return as-is
    if (typeof imgCandidate === 'string' && imgCandidate.startsWith('data:')) return imgCandidate;

    // If backend is down, avoid constructing remote MEDIA URLs to prevent connection errors
    if (!backendAvailable) return employeeBonjingData.profileImage;

    // If it's a string, handle secure/absolute/relative paths
    if (typeof imgCandidate === 'string') {
      if (isSecureUrl(imgCandidate)) return imgCandidate;

        const secure = convertToSecureUrl(imgCandidate);
        if (secure) return secure;

        if (imgCandidate.startsWith('http')) return imgCandidate;

      // Handle cases where the stored path was saved with a '/public/' prefix
      // Trim whitespace to avoid missed prefixes (some stored values include leading spaces)
      let candidate = imgCandidate.trim();
      if (candidate.startsWith('/public/')) candidate = candidate.replace(/^\/public\//, '/');
      if (candidate.startsWith('public/')) candidate = candidate.replace(/^public\//, '');

      // If the stored value already contains a leading 'media/' segment
      // (e.g. '/media/employee_images/...'), strip that so we don't
      // produce duplicated '/media/media/...' when prefixing MEDIA_URL.
      candidate = candidate.replace(/^\/?media\//, '');

      const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || `${API_CONFIG.BACKEND.BASE_URL.replace(/\/$/, '')}/media/`;
      const clean = candidate.startsWith('/') ? candidate.slice(1) : candidate;
      return `${MEDIA_URL}${clean}`;
    }

    return employeeBonjingData.profileImage;
  };

  // Revoke any object URLs created for file blobs when the component unmounts
  useEffect(() => {
    return () => {
      try {
        const urls = getProfileImageSrc._createdUrlsRef || [];
        urls.forEach((u) => {
          try { URL.revokeObjectURL(u); } catch (e) {}
        });
      } catch (err) {}
    };
  }, []);

  // Track which URLs we've attempted an authenticated fetch for to avoid retry loops
  const attemptedAuthFetchRef = useRef(new Set());

  // Quick backend reachability probe to avoid rendering broken media URLs when devserver is down
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);

    (async () => {
      try {
        const base = API_CONFIG.BACKEND.BASE_URL.replace(/\/$/, '');
        const probeUrl = `${base}/api/`;
        const res = await fetch(probeUrl, { method: 'GET', signal: controller.signal });
        if (!cancelled) setBackendAvailable(res.ok);
      } catch (e) {
        if (!cancelled) setBackendAvailable(false);
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  const toggleNotification = () => {
    setShowNotification((prev) => !prev);
    setOpenDropdown(null);
    setShowProfileMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setShowProfileMenu(false);
        setShowNotification(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
                    setIsMobileMenuOpen(false);
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
    <nav className={`${styles['main-nav-bar']} ${scrolled ? styles.scrolled : ''}`} ref={navRef}>
      <section>
        <div className={styles['logo-placeholder']}>
          <img src={MapLogo} alt="Logo" className={styles['logo-image']} />
          <div className={styles['brand-wrapper']}>
            <span className={styles['brand-name']}>SmartSupport</span>
            <span className={styles['role-badge']}>{currentUser?.role}</span>
          </div>
        </div>
      </section>

      <section>
        <ul className={`${styles['nav-list']} ${isMobileMenuOpen ? styles.open : ''}`}>
          {/* Mobile profile section - mirrors Coordinator mobile layout */}
          <li className={styles['mobile-profile-section']}>
            <div className={styles['profile-avatar-large']}>
              <img src={profileImageUrl} alt="Profile" className={styles['avatar-image']} />
            </div>
            <div className={styles['mobile-profile-info']}>
              <h3>{getFullName()}</h3>
              <span className={styles['role-badge']}>{currentUser?.role}</span>
              <div className={styles['mobile-profile-actions']}>
                <button className={styles['mobile-settings-btn']} onClick={() => { setIsMobileMenuOpen(false); setTimeout(() => navigate('/employee/settings'), 0); }}>Settings</button>
                <button className={styles['mobile-logout-btn']} onClick={handleLogout}>Log Out</button>
              </div>
            </div>
          </li>

          <li className={styles['nav-item']}>
            <NavLink
              to="/employee/home"
              className={({ isActive }) =>
                `${styles['nav-link']} ${isActive ? styles['active-link'] : ''}`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </NavLink>
          </li>
          {renderDropdownMenu('active')}
          {renderDropdownMenu('records')}
          {/* Mobile menu actions: notifications/profile quick access */}
          <li className={styles['nav-item'] + ' ' + styles['mobile-only-action']}>
            <button onClick={() => { setIsMobileMenuOpen(false); toggleNotification(); }}>Notifications</button>
          </li>
        </ul>
      </section>

      <section className={styles['nav-right-section']}>
        {/* Right-side hamburger for mobile (matches Coordinator admin behavior) */}
        <button
          className={`${styles.hamburgerBtn} ${isMobileMenuOpen ? styles.open : ''}`}
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
        {!scrolled && (
          <>
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
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className={styles['avatar-placeholder']}
                />
              </div>
              {showProfileMenu && (
                <div className={styles['profile-dropdown']}>
                  <div className={styles['profile-header']}>
                    <div className={styles['profile-avatar-large']}>
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className={styles['avatar-image']}
                      />
                    </div>
                    <div className={styles['profile-info']}>
                      <h3>{getFullName()}</h3>
                      <span className={styles['role-badge']}>{currentUser?.role}</span>
                    </div>
                  </div>
                  <div className={styles['profile-menu']}>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        // Small delay to ensure menu closes before navigation
                        setTimeout(() => navigate('/employee/settings'), 0);
                      }}
                    >
                      Settings
                    </button>
                    <button
                      className={styles['logout-btn']}
                      onClick={handleLogout}
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </nav>
  );
};

export default EmployeeNavBar;