import { Outlet } from 'react-router-dom';
import CoordinatorAdminNavBar from '../components/header/CoordinatorAdminNavigationBar';
import styles from './CoordinatorAdminLayout.module.css';

const CoordinatorAdminLayout = () => {
  return (
    <div className={styles.layoutRoot}>
      <header className={styles.navbarWrapper}>
        <CoordinatorAdminNavBar />
      </header>

      <div className={styles.scrollContainer}>
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CoordinatorAdminLayout;
