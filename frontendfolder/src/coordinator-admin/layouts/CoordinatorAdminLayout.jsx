import { Outlet } from 'react-router-dom';
import CoordinatorAdminNavBar from '../components/header/CoordinatorAdminNavigationBar';
import styles from './CoordinatorAdminLayout.module.css'; // Assuming this contains .navbarWrapper, .scrollContainer, etc.

const CoordinatorAdminLayout = () => {
  return (
    <>
      <div className={styles.navbarWrapper}>
        <CoordinatorAdminNavBar />
      </div>

      <div className={styles.scrollContainer}>
        <main className={styles['employee-layout-main']}>
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default CoordinatorAdminLayout;
