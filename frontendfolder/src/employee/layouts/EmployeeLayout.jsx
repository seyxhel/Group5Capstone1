import { Outlet, useLocation } from 'react-router-dom';
import EmployeeNavBar from '../components/header/EmployeeNavigationBar';
import TopPageSectionHeader from '../../shared/section-header/TopPageSectionHeader';
import './EmployeeLayout.css';

const EmployeeLayout = () => {
  const location = useLocation();

  const showTopSection = location.pathname === '/employee/submit-ticket';

  return (
    <>
      <div className="navbarWrapper">
        <EmployeeNavBar />
      </div>

      {/* ⬇️ Scrollable container starts below fixed navbar */}
      <div className="scrollContainer">
        <main className="employee-layout-main">
          {showTopSection && (
            <TopPageSectionHeader
              root="Home"
              currentPage="Submit Ticket"
              rootNavigatePage="/employee/home"
              title="Ticket Submission Form"
            />
          )}
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default EmployeeLayout;
