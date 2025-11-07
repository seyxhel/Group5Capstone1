import { Outlet, useLocation, matchPath } from 'react-router-dom';
import EmployeeNavBar from '../components/header/EmployeeNavigationBar';
import Breadcrumb from '../../shared/components/Breadcrumb';
import { getEmployeeTickets } from '../../utilities/storages/ticketStorage';
import { isActiveStatus } from '../../utilities/helpers/statusMapper';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../shared/layouts/PageLayout';

const getHeaderConfig = (path, currentUser) => {
  const ticketMatch = matchPath({ path: '/employee/ticket-tracker/:ticketNumber', end: true }, path);

  if (ticketMatch) {
    const ticketNumber = ticketMatch.params.ticketNumber;
    const tickets = getEmployeeTickets(currentUser?.id);
    const ticket = tickets.find((t) => String(t.ticketNumber) === String(ticketNumber));
    const isActive = ticket && isActiveStatus(ticket.status);

    return {
      root: isActive ? 'Active Tickets' : 'Ticket Records',
      currentPage: 'Ticket Tracker',
      rootNavigatePage: isActive
        ? '/employee/active-tickets/all-active-tickets'
        : '/employee/ticket-records/all-ticket-records',
      title: `${ticketNumber}`,
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
  const { user: currentUser } = useAuth();
  const headerConfig = getHeaderConfig(pathname, currentUser);

  return (
    <PageLayout Navbar={EmployeeNavBar}>
      {headerConfig && (
        <Breadcrumb
          root={headerConfig.root}
          currentPage={headerConfig.currentPage}
          rootNavigatePage={headerConfig.rootNavigatePage}
          title={headerConfig.title}
        />
      )}
      <Outlet />
    </PageLayout>
  );
};

export default EmployeeLayout;
