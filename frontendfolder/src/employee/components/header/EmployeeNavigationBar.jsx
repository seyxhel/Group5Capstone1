import { useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import MapLogo from '../../../shared/assets/MapLogo.png';
import EmployeeNotification from '../popups/EmployeeNotification';
import authService from '../../../utilities/service/authService';
// Dropdown items left-aligned with flex display
import NavigationBar from '../../../shared/components/NavigationBar.jsx';
import customNavStyles from './EmployeeNavigationBar.module.css';

// Note: dropdown menu was moved inside `.dropdown-container` to
// support mobile accordion rendering (dropdown-container -> dropdown-menu).
// Mobile items are left-aligned under the trigger via CSS text-align: left !important;
// Dropdown state (openSection, togzgleSection, closeSection) is now centralized in NavigationBar.jsx.
// Mobile nav now uses drawer style (slides from left with fixed 280px width).

const EmployeeNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const navRef = useRef(null);

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

  const sections = [
    {
      key: 'active',
      label: dropdowns.active.label,
      basePath: dropdowns.active.path,
      links: dropdowns.active.items.map(([route, label]) => ({ label, path: `${dropdowns.active.path}${route}` })),
    },
    {
      key: 'records',
      label: dropdowns.records.label,
      basePath: dropdowns.records.path,
      links: dropdowns.records.items.map(([route, label]) => ({ label, path: `${dropdowns.records.path}${route}` })),
    },
  ];

  // Employee supplies `navContent` (Home + dropdowns) so navigation
  // behavior (routing) remains here while layout stays in NavigationBar.
  const navContent = ({ closeMobileMenu, toggleSection, openSection, closeSection, ChevronIcon, mergedStyles, onNavigate }) => {
    const renderDropdownMenu = (key) => {
      const dropdown = dropdowns[key];
      const isInPath = dropdown.items.some(([route]) => location.pathname === `${dropdown.path}${route}`);
      const isOpen = openSection === key;

      return (
        <li key={key} data-open={isOpen ? 'true' : 'false'} data-current={isInPath ? 'true' : 'false'} data-section={key} className={mergedStyles['nav-item']}>
          <div
            className={`${mergedStyles['dropdown-container']} ${isOpen ? mergedStyles['open'] : ''} ${isInPath ? mergedStyles['active-link'] : ''}`}
            data-open={isOpen ? 'true' : 'false'}
            data-current={isInPath ? 'true' : 'false'}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSection(key);
              }
            }}
          >
            <button
              className={`${mergedStyles['dropdown-trigger']}`}
              aria-expanded={isOpen}
              onClick={() => toggleSection(key)}
              type="button"
            >
              <span className={mergedStyles['dropdown-text']}>{dropdown.label}</span>
              {ChevronIcon && (
                <ChevronIcon
                  className={`${mergedStyles['arrow-icon']} ${isOpen ? mergedStyles['arrow-flipped'] : ''}`}
                />
              )}
            </button>

            {isOpen && (
              <div
                className={mergedStyles['custom-dropdown']}
                role="menu"
              >
                <div className={mergedStyles['dropdown-menu']}>
                  {dropdown.items.map(([route, label], index) => {
                    const itemPath = `${dropdown.path}${route}`;
                    const isCurrentItem = location.pathname === itemPath;
                    return (
                      <button
                        key={route}
                        role="menuitem"
                        data-current={isCurrentItem ? 'true' : 'false'}
                        className={mergedStyles['dropdown-menu-item']}
                        onClick={() => {
                          closeSection();
                          closeMobileMenu();
                          if (typeof onNavigate === 'function') onNavigate(itemPath);
                        }}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </li>
      );
    };

    return (
      <>
        <li data-section="home" className={mergedStyles['nav-item']}>
          <NavLink 
            to="/employee/home" 
            className={({ isActive }) => `${mergedStyles['nav-link']} ${isActive ? mergedStyles['active-link'] : ''}`}
            onClick={() => closeMobileMenu()}
          >
            Home
          </NavLink>
        </li>

        {renderDropdownMenu('active')}
        {renderDropdownMenu('records')}
      </>
    );
  };

  return (
    <NavigationBar
      logoImage={MapLogo}
      brandName="SmartSupport"
      homePath="/employee/home"
      logoPath="/employee/home"
      brandPath="/employee/home"
      onNavigate={(p) => { navigate(p); }}
      customNavStyles={customNavStyles}
      navRole="employee"
      navContent={navContent}
      sections={sections}
      NotificationDropdown={EmployeeNotification}
      notificationProps={{}}
      currentUser={currentUser}
      profileSettingsPath="/employee/settings"
      profileLogoutPath="/"
      forceFixed={true}
      navRef={navRef}
    />
  );
};

export default EmployeeNavBar;