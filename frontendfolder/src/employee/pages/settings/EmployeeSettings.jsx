import styles from './EmployeeSettings.module.css';
import employeeBonjingData from '../../../utilities/storages/employeeBonjing';

const EmployeeSettings = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Settings</h2>

      {/* Personal Information Section */}
      <div className={styles.section}>
        <h3>Personal Information</h3>
        <div className={styles.fieldGroup}>
          <label>Last Name</label>
          <input type="text" value={employeeBonjingData.lastName} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>First Name</label>
          <input type="text" value={employeeBonjingData.firstName} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Middle Name</label>
          <input type="text" value={employeeBonjingData.middleName} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Suffix</label>
          <input type="text" value={employeeBonjingData.suffix} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Company ID</label>
          <input type="text" value={employeeBonjingData.companyId} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Department</label>
          <input type="text" value={employeeBonjingData.department} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Role</label>
          <input type="text" value={employeeBonjingData.role} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Email</label>
          <input type="email" value={employeeBonjingData.email} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Upload Profile Picture</label>
          <input type="file" accept="image/*" />
        </div>
        <button className={styles.saveButton}>Save Changes</button>
      </div>

      {/* Security Section */}
      <div className={styles.section}>
        <h3>Security</h3>
        <div className={styles.fieldGroup}>
          <label>Current Password (hashed)</label>
          <input type="password" disabled value="••••••••••••••" />
        </div>
        <div className={styles.fieldGroup}>
          <label>New Password</label>
          <input type="password" />
        </div>
        <div className={styles.fieldGroup}>
          <label>Confirm Password</label>
          <input type="password" />
        </div>
        <button className={styles.saveButton}>Save New Password</button>
      </div>
    </div>
  );
};

export default EmployeeSettings;
