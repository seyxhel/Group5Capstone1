import { Outlet } from 'react-router-dom';
import CoordinatorAdminNavBar from '../components/header/CoordinatorAdminNavigationBar';
import './CoordinatorAdminLayout.module.css'; // optional for layout styling

const CoordinatorAdminLayout = () => {
  return (
    <>
      <CoordinatorAdminNavBar />
      <main className="admin-layout-main">
        <Outlet />
      </main>
    </>
  );
};

export default CoordinatorAdminLayout;
