import { Outlet, useLocation, matchPath } from 'react-router-dom';
import EmployeeNavBar from '../components/header/EmployeeNavigationBar';
import Breadcrumb from '../../shared/components/Breadcrumb';
import { getEmployeeTickets } from '../../utilities/storages/ticketStorage';
import { isActiveStatus } from '../../utilities/helpers/statusMapper';
import authService from '../../utilities/service/authService';
import PageLayout from '../../shared/layouts/PageLayout';

const getHeaderConfig = (path) => {
  const ticketMatch = matchPath({ path: '/employee/ticket-tracker/:ticketNumber', end: true }, path);

  if (ticketMatch) {
    const ticketNumber = ticketMatch.params.ticketNumber;
    const currentUser = authService.getCurrentUser();
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
    // breadcrumb intentionally omitted for immersive pages
    // FAQ intentionally omitted to prevent breadcrumb rendering on the FAQ page
  };

  return staticHeaders[path] || null;
};

const EmployeeLayout = () => {
  const { pathname } = useLocation();
  const headerConfig = getHeaderConfig(pathname);

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
