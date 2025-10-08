import { useState, useEffect, useRef } from 'react';
import styles from './EmployeeSettings.module.css';
import authService from '../../../utilities/service/authService';
import { employees as employeeService } from '../../../services/apiService';

const EmployeeSettings = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentPwd, setCurrentPwd] = useState('');
  const [currentVerified, setCurrentVerified] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMessage, setPwdMessage] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setForm({
      lastName: user?.lastName || user?.last_name || '',
      firstName: user?.firstName || user?.first_name || '',
      middleName: user?.middleName || user?.middle_name || '',
      suffix: user?.suffix || '',
      companyId: user?.companyId || user?.company_id || '',
      department: user?.department || '',
      role: user?.role || '',
      email: user?.email || '',
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validatePasswordNIST = (pwd) => {
    // Minimal NIST-like rules for strong passwords (example):
    // - Minimum length 12
    // - At least one lowercase, one uppercase, one digit, one symbol
    if (!pwd || pwd.length < 12) return { ok: false, reason: 'Password must be at least 12 characters.' };
    if (!/[a-z]/.test(pwd)) return { ok: false, reason: 'Include a lowercase letter.' };
    if (!/[A-Z]/.test(pwd)) return { ok: false, reason: 'Include an uppercase letter.' };
    if (!/[0-9]/.test(pwd)) return { ok: false, reason: 'Include a number.' };
    if (!/[\W_]/.test(pwd)) return { ok: false, reason: 'Include a symbol.' };
    // very small common-password check
    const common = ['password','12345678','qwerty','letmein','admin','welcome'];
    if (common.includes(pwd.toLowerCase())) return { ok: false, reason: 'Password is too common.' };
    return { ok: true };
  };

  const verifyCurrentPassword = async () => {
    setPwdMessage(null);
    if (!currentPwd) {
      setCurrentVerified(false);
      return;
    }
    try {
      await employeeService.verifyCurrentPassword(currentPwd);
      setCurrentVerified(true);
      setPwdMessage('Current password verified. You may enter a new password.');
    } catch (err) {
      setCurrentVerified(false);
      setPwdMessage('Current password is incorrect.');
    }
  };

  // Auto-verify current password while user types (debounced)
  useEffect(() => {
    if (!currentPwd) {
      setCurrentVerified(false);
      setPwdMessage(null);
      return;
    }
    const t = setTimeout(() => {
      verifyCurrentPassword();
    }, 500);
    return () => clearTimeout(t);
  }, [currentPwd]);

  const handleNewPwdChange = (e) => {
    const v = e.target.value;
    setNewPwd(v);
    const res = validatePasswordNIST(v);
    if (!res.ok) {
      setPwdMessage(res.reason);
    } else {
      setPwdMessage('New password meets strength requirements.');
    }
  };

  const handleConfirmPwdChange = (e) => {
    setConfirmPwd(e.target.value);
  };

  const canSaveNewPassword = () => {
    if (!currentVerified) return false;
    const res = validatePasswordNIST(newPwd);
    if (!res.ok) return false;
    if (!confirmPwd) return false;
    if (newPwd !== confirmPwd) return false;
    return true;
  };

  const handleSavePassword = async () => {
    if (!canSaveNewPassword()) return;
    try {
      // Call change password endpoint
      await employeeService.changePassword(currentPwd, newPwd);
      setPwdMessage('Password changed successfully. Please re-login.');
      // Optionally log the user out to force re-login
      // authService.logout();
    } catch (err) {
      setPwdMessage(err.message || 'Failed to change password');
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    setMessage(null);

    // Prepare payload mapping to backend field names if needed
    const payload = {
      last_name: form.lastName,
      first_name: form.firstName,
      middle_name: form.middleName,
      suffix: form.suffix,
      company_id: form.companyId,
      department: form.department,
      role: form.role,
      email: form.email,
    };

    try {
      // If using backend service, call backend update; otherwise local service also exposes updateEmployeeProfile
      let updated;
      if (employeeService.updateEmployee) {
        // backend-style
        updated = await employeeService.updateEmployee(currentUser.id || currentUser.pk || currentUser.id, payload);
      } else if (employeeService.updateEmployeeProfile) {
        updated = await employeeService.updateEmployeeProfile(currentUser.id || currentUser.pk || currentUser.id, payload);
      }

      // If user picked a file, upload it using uploadEmployeeImage if available
      const file = fileRef.current?.files?.[0];
      if (file && employeeService.uploadEmployeeImage) {
        await employeeService.uploadEmployeeImage(currentUser.id || currentUser.pk || currentUser.id, file);
      }

      // Try to refresh full profile from API (so image URL updated server-side is returned)
      let refreshed = updated || null;
      if (employeeService.getCurrentEmployee) {
        try {
          refreshed = await employeeService.getCurrentEmployee();
        } catch (err) {
          // fall back to merged payload below
          refreshed = refreshed || { ...currentUser, ...payload };
        }
      } else {
        refreshed = refreshed || { ...currentUser, ...payload };
      }
      // Try to normalize field names to the app's expected shape and include image
      const normalized = {
        ...currentUser,
        ...{
          lastName: refreshed.last_name || refreshed.lastName || refreshed.last_name,
          firstName: refreshed.first_name || refreshed.firstName || refreshed.first_name,
          middleName: refreshed.middle_name || refreshed.middleName || refreshed.middle_name,
          suffix: refreshed.suffix || '',
          companyId: refreshed.company_id || refreshed.companyId || '',
          department: refreshed.department || '',
          role: refreshed.role || '',
          email: refreshed.email || form.email,
          // include image fields; preserve existing image if refreshed doesn't return one
          image: (refreshed.image || refreshed.profile_image || refreshed.image?.url) || currentUser.image || currentUser.profile_image || currentUser.profileImage || null,
          profile_image: (refreshed.profile_image || refreshed.image) || currentUser.profile_image || currentUser.image || null,
          profileImage: refreshed.profileImage || refreshed.image || refreshed.profile_image || currentUser.profileImage || currentUser.image || null,
        }
      };

      // Update form values to reflect the saved server state
      setForm((f) => ({
        ...f,
        lastName: normalized.lastName || f.lastName,
        firstName: normalized.firstName || f.firstName,
        middleName: normalized.middleName || f.middleName,
        suffix: normalized.suffix || f.suffix,
        companyId: normalized.companyId || f.companyId,
        department: normalized.department || f.department,
        role: normalized.role || f.role,
        email: normalized.email || f.email,
      }));

      localStorage.setItem('loggedInUser', JSON.stringify(normalized));
      setCurrentUser(normalized);
      setMessage('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile', err);
      setMessage(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Settings</h2>

      {/* Personal Information Section */}
      <div className={styles.section}>
        <h3>Personal Information</h3>
        <div className={styles.fieldGroup}>
          <label>Last Name</label>
          <input name="lastName" type="text" value={form.lastName || ''} onChange={handleChange} />
        </div>
        <div className={styles.fieldGroup}>
          <label>First Name</label>
          <input name="firstName" type="text" value={form.firstName || ''} onChange={handleChange} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Middle Name</label>
          <input name="middleName" type="text" value={form.middleName || ''} onChange={handleChange} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Suffix</label>
          <input name="suffix" type="text" value={form.suffix || ''} onChange={handleChange} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Company ID</label>
          <input name="companyId" type="text" value={form.companyId || ''} onChange={handleChange} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Department</label>
          <input name="department" type="text" value={form.department || ''} onChange={handleChange} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Role</label>
          <input name="role" type="text" value={form.role || ''} onChange={handleChange} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Email</label>
          <input name="email" type="email" value={form.email || ''} onChange={handleChange} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Upload Profile Picture</label>
          <input ref={fileRef} type="file" accept="image/*" />
        </div>
        <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {message && <div style={{ marginTop: 10 }}>{message}</div>}
      </div>

      {/* Security Section */}
      <div className={styles.section}>
        <h3>Security</h3>
        <div className={styles.fieldGroup}>
          <label>Current Password</label>
          <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
        </div>

        <div className={styles.fieldGroup}>
          <label>New Password</label>
          <input type="password" value={newPwd} onChange={handleNewPwdChange} disabled={!currentVerified} />
        </div>

        <div className={styles.fieldGroup}>
          <label>Confirm Password</label>
          <input type="password" value={confirmPwd} onChange={handleConfirmPwdChange} disabled={!currentVerified || !validatePasswordNIST(newPwd).ok} />
        </div>

        <button className={styles.saveButton} onClick={handleSavePassword} disabled={!canSaveNewPassword()}>
          Save New Password
        </button>
        {pwdMessage && <div style={{ marginTop: 8 }}>{pwdMessage}</div>}
      </div>
    </div>
  );
};

export default EmployeeSettings;
