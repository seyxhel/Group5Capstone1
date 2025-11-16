import { useState } from 'react';
import CSATTab from './CSATTab';
import styles from './CoordinatorAdminDashboard.module.css';

const CoordinatorAdminCSATPage = () => {
  const [chartRange, setChartRange] = useState('month');
  const [pieRange, setPieRange] = useState('month');

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContent}>
        <h1 className={styles.title}>CSAT</h1>
        <div style={{ marginTop: 12 }}>
          <CSATTab
            chartRange={chartRange}
            setChartRange={setChartRange}
            pieRange={pieRange}
            setPieRange={setPieRange}
          />
        </div>
      </div>
    </div>
  );
};

export default CoordinatorAdminCSATPage;
