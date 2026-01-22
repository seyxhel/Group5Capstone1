import { useRef, useEffect, useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import styles from './NavigationBar.module.css';
import { getUnreadCount } from '../../utilities/storages/notificationStorage';
import useScrollShrink from '../hooks/useScrollShrink.jsx';

/**
 * SharedNavigationLayout - A reusable navigation bar layout component
 * 
 * Props:
 * - logoImage: URL of the logo image
 * - brandName: Name of the brand/app
 * - navContent: JSX content for the navigation middle section (dropdowns, links)
 * - rightSectionContent: JSX content for the right section (notifications, profile)
 * - mobileMenuOpen: boolean state for mobile menu
 * - onMobileMenuToggle: function to toggle mobile menu
 * - scrolled: boolean state for scroll-based styling
 * - customNavStyles: CSS module styles to apply to the nav bar
 * - navRef: ref to attach to the nav element (optional, created internally if not provided)
 */
const SharedNavigationLayout = ({
  logoImage,
  brandName,
  // navContent may be JSX or a render-function receiving helpers
  navContent,
  // Optional: consumer-supplied notification dropdown component
  NotificationDropdown,
  // Optional extra props to pass into NotificationDropdown
  notificationProps = {},
  // current user object for profile rendering
  currentUser,
  // profile links
  profileSettingsPath = '/',
  profileLogoutPath = '/',
  customNavStyles = styles,
  // When true, force the nav to be fixed at the viewport top (overrides CSS).
  forceFixed = false,
  navRef: externalRef,
  // Optional: array of nav `sections` passed from role-specific navs so
  // the shared layout can compute which section is currently active and
  // expose it via a data attribute for centralized styling.
  sections = [],
  // optional override for the Home link route
  homePath = '/',
  // optional paths for clicking the logo and brand
  logoPath = '/',
  brandPath = '/',
  // optional navigation delegator: (path) => void
  onNavigate: externalNavigate,
  // optional boolean to force the compact styling from the consumer
  compactOverride = false,
  // optional role identifier passed by role-specific navs. Used for role-scoped CSS.
  navRole = '',
  // optional renderer for the Home trigger - consumer-provided button
  homeRenderer,
  // optional boolean to force showing the hamburger (consumer-controlled)
  showHamburgerForce,
}) => {
  const internalRef = useRef(null);
  const navRef = externalRef || internalRef;
  const navigate = useNavigate();
  const location = useLocation();
  const onNavigate = typeof externalNavigate === 'function' ? externalNavigate : (p) => navigate(p);

  // Refs for measuring nav center and list to determine overflow
  const navCenterRef = useRef(null);
  const navListRef = useRef(null);
  const navLeftRef = useRef(null);
  const navRightRef = useRef(null);

  // Shared state for notification/profile dropdowns and counts
  const [openDropdown, setOpenDropdown] = useState(null);
  // Shared state for top-level nav sections (dropdowns like Active Tickets)
  // Centralized here so styling (data-open) and behavior are consistent
  const [openSection, setOpenSection] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const notificationAnchorRef = useRef(null);

  // Initialize notification count from storage so the badge is visible
  // before the user opens the notification dropdown.
  useEffect(() => {
    try {
      const id = currentUser?.id;
      if (id) {
        const count = getUnreadCount(id);
        setNotifCount(count || 0);
      }
    } catch (e) {
      // ignore storage read errors
    }
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setOpenSection(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navRef]);

  // Mobile menu state - fully owned by NavigationBar
  // Parents no longer manage this; NavigationBar is self-contained
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileOpen(prev => {
      const newState = !prev;
      // Sync body class immediately
      if (newState) {
        document.body.classList.add('mobile-menu-open');
      } else {
        document.body.classList.remove('mobile-menu-open');
      }
      return newState;
    });
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
    document.body.classList.remove('mobile-menu-open');
  };

  const openNotifications = () => setOpenDropdown((prev) => (prev === 'notifications' ? null : 'notifications'));
  const openProfile = () => setOpenDropdown((prev) => (prev === 'profile' ? null : 'profile'));

  const toggleSection = (key) => setOpenSection((prev) => (prev === key ? null : key));
  const closeSection = () => setOpenSection(null);

  // Detect mobile width for layout rendering
  const [isMobile, setIsMobile] = useState(false);
  // Treat widths under 1024px as "narrow" so the hamburger appears for
  // tablet / small-desktop sizes (<1024px). Keep `isMobile` for the
  // original mobile-only behavior (<=768px).
  const [isNarrow, setIsNarrow] = useState(false);

  // When true the hamburger is shown because nav items don't fit
  const [showHamburgerByOverflow, setShowHamburgerByOverflow] = useState(false);
  // When true the hamburger is shown because the center nav collides
  // with the right-side controls (notification/profile). This detects
  // visual overlap that may not be captured by scrollWidth checks.
  const [showHamburgerByCollision, setShowHamburgerByCollision] = useState(false);
  // When true the hamburger is shown because there are 5+ items (for coordinator nav)
  const [showHamburgerByCount, setShowHamburgerByCount] = useState(false);
  // When true the nav should compact because there are many items (>=5)
  const [compactByCount, setCompactByCount] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isNowMobile = window.innerWidth <= 768;
      const isNowNarrow = window.innerWidth < 1024;
      setIsMobile(isNowMobile);
      setIsNarrow(isNowNarrow);
      // If we've grown out of mobile size and the mobile menu is open,
      // ensure it is closed so desktop layout returns to normal.
      if (!isNowMobile && isMobileOpen) {
        // Ensure mobile menu is closed when resizing to desktop
        closeMobileMenu();
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Extra safety: when viewport becomes desktop-sized, clear any inline
  // mobile-only styles that may have been applied to the nav list or its
  // children so the desktop CSS rules take effect immediately.
  useEffect(() => {
    const clearMobileInlineStyles = () => {
      try {
        if (typeof window === 'undefined') return;
        if (window.innerWidth > 768) {
          const list = navListRef.current;
          if (list) {
            // remove mobile-open class if present
            try { list.classList.remove(styles.open); } catch (e) {}
            // Clear ALL inline styles - let CSS media queries handle everything
            list.removeAttribute('style');

            // clear any inline styles applied to direct children
            const children = Array.from(list.querySelectorAll(':scope > *'));
            children.forEach((c) => {
              try {
                c.removeAttribute('style');
              } catch (e) {}
            });
          }
        }
      } catch (e) {
        // swallow errors in older browsers
      }
    };

    window.addEventListener('resize', clearMobileInlineStyles);
    // also run once on mount in case the page was loaded resized
    clearMobileInlineStyles();
    return () => window.removeEventListener('resize', clearMobileInlineStyles);
  }, [isMobileOpen]);

  // Detect whether the center nav overflows its container (show hamburger if so)
  useEffect(() => {
    const checkOverflow = () => {
      const list = navListRef.current;
      const container = navCenterRef.current;
      if (!list || !container) return setShowHamburgerByOverflow(false);
      // If the list's scroll width is larger than the available width, it overflows
      const over = list.scrollWidth > container.clientWidth - 4; // minimal padding allowance
      setShowHamburgerByOverflow(over);
      try {
        const itemCount = list.querySelectorAll(':scope > li').length;
        setCompactByCount(itemCount >= 5);
        
        // CRITICAL: Show hamburger when nav has 5+ items AND NOT full desktop (< 1920px)
        // This applies to ALL roles (coordinator, system admin, employee, etc.)
        // If it's not full screen desktop, show the hamburger with 5+ items
        const notFullDesktop = window.innerWidth < 1920;
        const hasEnoughItems = itemCount >= 5;
        const shouldShowHamburger = hasEnoughItems && notFullDesktop;
        
        setShowHamburgerByCount(shouldShowHamburger);
      } catch (e) {
        // ignore
      }
    };

    // Use ResizeObserver if available
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(checkOverflow);
      if (navCenterRef.current) ro.observe(navCenterRef.current);
      if (navListRef.current) ro.observe(navListRef.current);
    }

    // Listen to window resize without debounce for immediate response
    const handleResize = () => {
      checkOverflow();
    };
    window.addEventListener('resize', handleResize);
    
    // Initial check with a small delay to allow DOM to settle
    const timer = setTimeout(checkOverflow, 50);
    // Secondary check after 200ms to catch late renders
    const timer2 = setTimeout(checkOverflow, 200);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Detect visual collision between the center nav and the right controls.
  // This is a safety net for cases where equalized widths or CSS sizing
  // produce an overlap without the list being scrollable.
  useEffect(() => {
    let raf = null;
    const checkCollision = () => {
      try {
        const list = navListRef.current;
        const right = navRightRef.current;
        const left = navLeftRef.current;
        if (!list || !right || !left) return setShowHamburgerByCollision(false);

        const listRect = list.getBoundingClientRect();
        const rightRect = right.getBoundingClientRect();
        const leftRect = left.getBoundingClientRect();

        // If the right edge of the list intrudes into the left edge of
        // the right controls (minus a small buffer), consider it a collision.
        const buffer = 8; // px
        const collides = listRect.right > (rightRect.left - buffer) || listRect.left < (leftRect.right + buffer);
        setShowHamburgerByCollision(collides);
      } catch (e) {
        setShowHamburgerByCollision(false);
      }
    };

    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(checkCollision);
    };

    // observe changes to layout
    const ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(() => { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(checkCollision); }) : null;
    if (ro) {
      if (navListRef.current) ro.observe(navListRef.current);
      if (navCenterRef.current) ro.observe(navCenterRef.current);
      if (navRightRef.current) ro.observe(navRightRef.current);
    }

    // initial
    checkCollision();
    window.addEventListener('resize', onResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [navListRef, navRightRef, navLeftRef, navCenterRef]);

  // Measure left/right reserved widths (logo area and right controls) so
  // the `.nav-center` max-width calculation is accurate and keeps the
  // center truly centered regardless of role-level padding or avatar sizes.
  useEffect(() => {
    const updateSides = () => {
      const navEl = navRef.current;
      if (!navEl) return;
      const left = navLeftRef.current;
      const right = navRightRef.current;
      const leftW = left ? Math.ceil(left.getBoundingClientRect().width) : 0;
      const rightW = right ? Math.ceil(right.getBoundingClientRect().width) : 0;
      // add a tiny buffer to avoid clipping when glyphs overflow
      navEl.style.setProperty('--nav-left-width', `${leftW + 8}px`);
      navEl.style.setProperty('--nav-right-width', `${rightW + 8}px`);
      // expose the navbar's actual height so mobile overlay can sit below it
      try {
        const navH = Math.ceil(navEl.getBoundingClientRect().height);
        navEl.style.setProperty('--nav-height', `${navH}px`);
      } catch (e) {
        // noop
      }
    };

    updateSides();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateSides);
      if (navLeftRef.current) ro.observe(navLeftRef.current);
      if (navRightRef.current) ro.observe(navRightRef.current);
    }
    window.addEventListener('resize', updateSides);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateSides);
    };
  }, [navRef]);

  // Equalize section widths: find all li[data-section] and set a CSS variable to
  // the max width so each section uses the same width and keeps items centered.
  useEffect(() => {
    if (!navListRef.current) return;

    let resizeTimer;
    const measure = () => {
      const list = navListRef.current;
      // don't measure while mobile menu is open — that layout is transient
      if (!list || isMobileOpen) return;
      // Include all direct top-level list items so every nav item
      // (including Dashboard and any virtual sections) is measured
      // and equalized. Using ':scope > li' selects only immediate children.
      const sectionItems = Array.from(list.querySelectorAll(':scope > li'));
      if (!sectionItems.length) {
        list.style.removeProperty('--section-fixed-width');
        return;
      }

      // Temporarily clear inline width on children so we capture natural size
      sectionItems.forEach((el) => {
        try {
          const directChildren = Array.from(el.querySelectorAll(':scope > *'));
          directChildren.forEach((c) => {
            c.style.width = '';
            c.style.minWidth = '';
          });
        } catch (e) {}
      });

      // Allow browser to recalculate layout before measuring
      requestAnimationFrame(() => {
        // Measure each section's natural width
        const widths = sectionItems.map((el) => Math.ceil(el.getBoundingClientRect().width));
        const max = Math.max(...widths, 0);

        // Only update the CSS variable if the value changed meaningfully
        // (small fluctuations cause reflows and can lead to a measurement loop)
        // Use a slightly larger threshold (5px) for more responsive updates during resize
        try {
          const prevRaw = list.style.getPropertyValue('--section-fixed-width') || '';
          const prev = prevRaw ? parseInt(prevRaw, 10) : 0;
          if (!prev || Math.abs(prev - max) > 5) {
            list.style.setProperty('--section-fixed-width', `${max}px`);
          }
        } catch (e) {
          // fallback: set it anyway
          list.style.setProperty('--section-fixed-width', `${max}px`);
        }

        // Re-apply minimal inline layout rules for the visible controls so they
        // center content without forcing widths (these do not affect measurement)
        sectionItems.forEach((el) => {
          try {
            const child = el.querySelector(':scope > .dropdown-trigger, :scope > .nav-link, :scope > a, :scope > button');
            if (child) {
              child.style.display = 'inline-flex';
              child.style.alignItems = 'center';
              child.style.justifyContent = 'center';
              child.style.paddingLeft = child.style.paddingLeft || '0';
              child.style.paddingRight = child.style.paddingRight || '0';
              child.style.boxSizing = 'border-box';
            }
          } catch (e) {
            // ignore
          }
        });
      });
    };

    // Debounced resize handler to avoid excessive measurements
    const debouncedMeasure = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 100);
    };

    // initial measure after layout settles
    const t = setTimeout(measure, 50);

    // observe resizes to re-measure
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      if (navListRef.current) ro.observe(navListRef.current);
      if (navCenterRef.current) ro.observe(navCenterRef.current);
    }
    window.addEventListener('resize', debouncedMeasure);

    return () => {
      clearTimeout(t);
      clearTimeout(resizeTimer);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', debouncedMeasure);
    };
  }, [sections, isMobileOpen]);

  // Centralize scroll/shrink detection here so consumers don't need to import the hook
  const scrolled = useScrollShrink(0, { debug: false });

  // When mobile menu opens, add a body class so CSS can target 'mobile overlay active'
  useEffect(() => {
    try {
      if (isMobileOpen) {
        document.body.classList.add('mobile-menu-open');
      } else {
        document.body.classList.remove('mobile-menu-open');
      }
    } catch (e) {
      // ignore (SSR or restricted env)
    }
    return () => {
      try { document.body.classList.remove('mobile-menu-open'); } catch (e) {}
    };
  }, [isMobileOpen]);

  // As a last-resort override, when mobile menu is open force dropdowns
  // to render inline by applying inline styles to `.custom-dropdown` elements
  // inside the nav. This ensures mobile accordion behavior regardless of
  // CSS specificity or ordering issues.
  useEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;

    const forceInlineDropdowns = () => {
      // Target both class-based and attribute-based selectors for dropdowns
      const selectors = [
        '[class*="custom-dropdown"]',
        '[class*="dropdown-menu"]',
        '.custom-dropdown',
        '.dropdown-menu'
      ];
      
      const els = [];
      selectors.forEach(selector => {
        els.push(...Array.from(navEl.querySelectorAll(selector)));
      });

      if (isMobileOpen) {
        els.forEach((el) => {
          // Force accordion layout
          el.style.setProperty('position', 'static', 'important');
          el.style.setProperty('top', 'auto', 'important');
          el.style.setProperty('left', 'auto', 'important');
          el.style.setProperty('right', 'auto', 'important');
          el.style.setProperty('transform', 'none', 'important');
          el.style.setProperty('width', '100%', 'important');
          el.style.setProperty('max-width', 'none', 'important');
          el.style.setProperty('min-width', 'auto', 'important');
          el.style.setProperty('box-shadow', 'none', 'important');
          el.style.setProperty('border-radius', '0', 'important');
          el.style.setProperty('border', 'none', 'important');
          el.style.setProperty('opacity', '1', 'important');
          el.style.setProperty('pointer-events', 'auto', 'important');
          el.style.setProperty('display', 'flex', 'important');
          el.style.setProperty('flex-direction', 'column', 'important');
          el.style.setProperty('background', '#fafafa', 'important');
          el.style.setProperty('padding', '0', 'important');
          el.style.setProperty('margin', '0', 'important');
        });
      } else {
        // Remove all forced inline styles when mobile menu is closed
        els.forEach((el) => {
          const props = [
            'position', 'top', 'left', 'right', 'transform', 'width', 
            'max-width', 'min-width', 'box-shadow', 'border-radius', 
            'border', 'opacity', 'pointer-events', 'display', 
            'flex-direction', 'background', 'padding', 'margin'
          ];
          props.forEach(prop => el.style.removeProperty(prop));
        });
      }
    };

    // Initial force
    forceInlineDropdowns();

    // Watch for dynamically added dropdown elements
    const observer = new MutationObserver((mutations) => {
      let needsUpdate = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && (
              node.classList?.contains('custom-dropdown') ||
              node.classList?.contains('dropdown-menu') ||
              node.querySelector?.('[class*="custom-dropdown"], [class*="dropdown-menu"]')
            )) {
              needsUpdate = true;
            }
          });
        }
      });
      if (needsUpdate) {
        setTimeout(forceInlineDropdowns, 10);
      }
    });

    observer.observe(navEl, { 
      childList: true, 
      subtree: true, 
      attributeFilter: ['class'] 
    });

    return () => {
      observer.disconnect();
      // Clean up styles
      const selectors = [
        '[class*="custom-dropdown"]',
        '[class*="dropdown-menu"]',
        '.custom-dropdown',
        '.dropdown-menu'
      ];
      const els = [];
      selectors.forEach(selector => {
        try {
          els.push(...Array.from(navEl.querySelectorAll(selector)));
        } catch (e) {}
      });
      els.forEach((el) => {
        try {
          const props = [
            'position', 'top', 'left', 'right', 'transform', 'width', 
            'max-width', 'min-width', 'box-shadow', 'border-radius', 
            'border', 'opacity', 'pointer-events', 'display', 
            'flex-direction', 'background', 'padding', 'margin'
          ];
          props.forEach(prop => el.style.removeProperty(prop));
        } catch (e) {}
      });
    };
  }, [isMobileOpen, navRef]);

  // Render right controls (use shared `styles` plus role overrides)
  const rightControls = (
    <>
      <div className={`${styles['notification-icon-container']} ${customNavStyles['notification-icon-container'] || ''}`}>
        <div
          ref={notificationAnchorRef}
          className={`${styles['notification-icon-wrapper']} ${customNavStyles['notification-icon-wrapper'] || ''}`}
          onClick={() => openNotifications()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openNotifications();
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${styles['notif-icon']} ${customNavStyles['notif-icon'] || ''}`}>
            <path
              fillRule="evenodd"
              d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z"
              clipRule="evenodd"
            />
          </svg>
          {notifCount > 0 && <span className={`${styles['notification-badge']} ${customNavStyles['notification-badge'] || ''}`}>{notifCount}</span>}
        </div>

        {NotificationDropdown && (
          <NotificationDropdown
            show={openDropdown === 'notifications'}
            onClose={() => setOpenDropdown(null)}
            onCountChange={setNotifCount}
            {...(Object.assign({}, notificationProps, { anchorRef: notificationAnchorRef }))}
          />
        )}
      </div>

      {/* Profile */}
      <div className={`${styles['profile-container']} ${customNavStyles['profile-container'] || ''}`}>
        <div
          className={`${styles['profile-avatar']} ${customNavStyles['profile-avatar'] || ''}`}
          onClick={() => openProfile()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openProfile();
            }
          }}
        >
          <img src={currentUser?.profileImage} alt="Profile" className={`${styles['avatar-image']} ${customNavStyles['avatar-image'] || ''}`} />
        </div>

        {openDropdown === 'profile' && (
          <div className={`${styles['profile-dropdown']} ${customNavStyles['profile-dropdown'] || ''}`}>
            <div className={`${styles['profile-header']} ${customNavStyles['profile-header'] || ''}`}>
              <div className={`${styles['profile-avatar-large']} ${customNavStyles['profile-avatar-large'] || ''}`}>
                <img src={currentUser?.profileImage} alt="Profile" className={`${styles['avatar-image']} ${customNavStyles['avatar-image'] || ''}`} />
              </div>
              <div className={`${styles['profile-info']} ${customNavStyles['profile-info'] || ''}`}>
                <h3>{`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`}</h3>
              </div>
            </div>
            <div className={`${styles['profile-menu']} ${customNavStyles['profile-menu'] || ''}`}>
              <button
                onClick={() => {
                  setOpenDropdown(null);
                  closeMobileMenu();
                  navigate(profileSettingsPath || '/');
                }}
              >
                Settings
              </button>
              <button
                className={`${styles['logout-btn']} ${customNavStyles['logout-btn'] || ''}`}
                onClick={() => {
                  setOpenDropdown(null);
                  closeMobileMenu();
                  navigate(profileLogoutPath || '/');
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Prefer role-provided nav-list/open classes when available so role
  // modular CSS can fully control nav-list layout and behavior.
  // Combine shared baseline with role-specific overrides. Keep shared
  // `styles['nav-list']` so global behaviors (eg. body.mobile-menu-open)
  // still apply, then add `customNavStyles['nav-list']` last so role CSS
  // can override layout. Do the same for the `open` class.
  const navListClass = [
    styles['nav-list'],
    (customNavStyles && customNavStyles['nav-list']) ? customNavStyles['nav-list'] : '',
    isMobileOpen ? styles.open : '',
    isMobileOpen ? ((customNavStyles && customNavStyles.open) ? customNavStyles.open : '') : ''
  ].filter(Boolean).join(' ');

  // Default nav rendering when consumer doesn't supply `navContent`.
  const renderDefaultNav = ({ mergedStyles }) => {
    const ChevronIcon = FiChevronDown;
    return (
      <>
        {sections && sections.map((sec) => {
          const key = sec.key;
          const label = sec.label || sec.key;
          const basePath = sec.basePath || '';
          const items = sec.links || [];
          const isInPath = items.some((l) => location.pathname === l.path);
          const isOpen = openSection === key;

          return (
            <li key={key} data-open={isOpen ? 'true' : 'false'} data-current={isInPath ? 'true' : 'false'} data-section={key} className={mergedStyles['nav-item']}>
              <div
                className={`${mergedStyles['dropdown-container']} ${isOpen ? mergedStyles['open'] : ''} ${isInPath ? mergedStyles['active-link'] : ''}`}
                data-open={isOpen ? 'true' : 'false'}
                data-current={isInPath ? 'true' : 'false'}
              >
                {typeof sec.renderTrigger === 'function'
                  ? sec.renderTrigger({ key, isOpen, toggleSection: () => toggleSection(key), mergedStyles, onNavigate, closeMobileMenu, location })
                  : (
                    <div
                      className={`${mergedStyles['dropdown-trigger']}`}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isOpen}
                      onClick={() => toggleSection(key)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(key); } }}
                    >
                      <span className={mergedStyles['dropdown-text']}>{label}</span>
                      <ChevronIcon className={`${mergedStyles['arrow-icon']} ${isOpen ? mergedStyles['arrow-flipped'] : ''}`} />
                    </div>
                  )}
              </div>

              {isOpen && (
                <div className={mergedStyles['custom-dropdown']} role="menu">
                  <div className={mergedStyles['dropdown-menu']}>
                    {items.map((link, idx) => (
                      <button
                        key={link.path || link.label || idx}
                        role="menuitem"
                        data-current={location.pathname === (link.path || '') ? 'true' : 'false'}
                        className={mergedStyles['dropdown-menu-item']}
                        onClick={() => {
                          closeSection();
                          closeMobileMenu();
                          if (link.path) onNavigate(link.path);
                        }}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </>
    );
  };

  return (
    <nav
      className={`${styles['main-nav-bar']} ${customNavStyles['main-nav-bar'] || ''} ${scrolled ? styles.scrolled : ''} ${scrolled && customNavStyles.scrolled ? customNavStyles.scrolled : ''}`}
      data-nav-role={navRole || undefined}
      data-overflow={showHamburgerByOverflow ? 'true' : undefined}
          data-compact={(compactByCount || compactOverride) ? 'true' : undefined}
          data-show-hamburger={showHamburgerForce ? 'true' : undefined}
      ref={navRef}
      style={forceFixed ? { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100 } : undefined}
    >
      {/* Logo & Brand Section */}
      <section
        ref={navLeftRef}
        className={`${styles['logo-placeholder']} ${customNavStyles['logo-placeholder'] || ''}`}
        style={{ justifyContent: 'flex-start' }}
      >
            {(isNarrow || showHamburgerByOverflow || showHamburgerByCount || showHamburgerForce || showHamburgerByCollision) && (
              <button
                  className={`${styles.hamburgerBtn} ${customNavStyles.hamburgerBtn || ''} ${styles['hamburger-left']} ${customNavStyles['hamburger-left'] || ''}`}
                  onClick={toggleMobileMenu}
                  aria-expanded={isMobileOpen}
                  aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
                  // Inline display fallback: ensures hamburger is visible even
                  // when higher-specificity CSS rules hide it (useful during
                  // overlap/collision cases where CSS may still hide the button).
                  style={{ display: 'inline-flex' }}
                >
                  {isMobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                </button>
            )}
          {/* Logo + Brand act as a single clickable control */}
          <button
            className={`${styles['logo-btn']} ${customNavStyles['logo-btn'] || ''}`}
            onClick={() => {
              closeMobileMenu();
              // prefer logoPath, fallback to brandPath or homePath
              onNavigate(logoPath || brandPath || homePath);
            }}
            type="button"
            aria-label="Home"
          >
            <img src={logoImage} alt="Logo" className={`${styles['logo-image']} ${customNavStyles['logo-image'] || ''}`} />
            <span className={`${styles['brand-name']} ${customNavStyles['brand-name'] || ''}`}>{brandName}</span>
          </button>
      </section>

      {/* Navigation Links Section */}
      <section className={`${styles['nav-center']} ${customNavStyles['nav-center'] || ''}`} ref={navCenterRef}>
        {/* expose current section key as a data attribute so CSS can centrally
            target the active section without role components adding classes */}
        <ul
          ref={navListRef}
          data-current-section={(() => {
            try {
              if (!sections || !sections.length) return '';
              const s = sections.find((sec) => {
                if (!sec || !sec.basePath) return false;
                return location.pathname.startsWith(sec.basePath);
              });
              return s ? s.key : '';
            } catch (e) {
              return '';
            }
          })()}
          className={navListClass}
        >
          {typeof navContent === 'function'
            ? navContent({ closeMobileMenu, openNotifications, openProfile, toggleSection, closeSection, openSection, ChevronIcon: FiChevronDown, currentPath: location.pathname, mergedStyles: customNavStyles, onNavigate })
            : (navContent ? navContent : renderDefaultNav({ mergedStyles: customNavStyles }))}
        </ul>
      </section>

      {/* Right Section: Notifications & Profile */}
      {/* Always render in nav so they hide/show with navbar as one unit */}
      <section ref={navRightRef} className={styles['nav-right-section']}>
        {rightControls}
      </section>
    </nav>
  );
};

export default SharedNavigationLayout;
