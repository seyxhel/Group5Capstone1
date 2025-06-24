import { Outlet, useLocation, matchPath } from 'react-router-dom';
import EmployeeNavBar from '../components/header/EmployeeNavigationBar';
import TopPageSectionHeader from '../../shared/section-header/TopPageSectionHeader';
import { getEmployeeTickets } from '../../utilities/storages/employeeTicketStorageBonjing';
import './EmployeeLayout.css';

const activeStatuses = ['Submitted', 'Pending', 'Open', 'On Progress', 'On Hold', 'Resolved'];

const getHeaderConfig = (path) => {
  const ticketMatch = matchPath({ path: '/employee/ticket-tracker/:ticketNumber', end: true }, path);

  if (ticketMatch) {
    const ticketNumber = ticketMatch.params.ticketNumber;
    const tickets = getEmployeeTickets();
    const ticket = tickets.find((t) => String(t.ticketNumber) === String(ticketNumber));
    const isActive = ticket && activeStatuses.includes(ticket.status);

    return {
      root: isActive ? 'Active Tickets' : 'Ticket Records',
      currentPage: 'Ticket Tracker',
      rootNavigatePage: isActive
        ? '/employee/active-tickets/all-active-tickets'
        : '/employee/ticket-records/all-ticket-records',
      title: 'Ticket Tracker',
    };
  }

  const staticHeaders = {
    '/employee/submit-ticket': {
      root: 'Home',
      currentPage: 'Submit Ticket',
      rootNavigatePage: '/employee/home',
      title: 'Ticket Submission Form',
    },
    '/employee/frequently-asked-questions': {
      root: 'Home',
      currentPage: 'Frequently Asked Questions',
      rootNavigatePage: '/employee/home',
      title: 'Frequently Asked Questions',
    },
  };

  return staticHeaders[path] || null;
};

const EmployeeLayout = () => {
  const { pathname } = useLocation();
  const headerConfig = getHeaderConfig(pathname);

  return (
    <>
      <div className="navbarWrapper">
        <EmployeeNavBar />
      </div>

      <div className="scrollContainer">
        <main className="employee-layout-main">
          {headerConfig && (
            <TopPageSectionHeader
              root={headerConfig.root}
              currentPage={headerConfig.currentPage}
              rootNavigatePage={headerConfig.rootNavigatePage}
              title={headerConfig.title}
            />
          )}
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default EmployeeLayout;
