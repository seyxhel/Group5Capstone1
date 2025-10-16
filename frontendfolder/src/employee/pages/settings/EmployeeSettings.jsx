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
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    console.log('Settings - Current user from authService:', user);
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
    // Simple password validation: minimum 8 characters
    if (!pwd || pwd.length < 8) {
      return { ok: false, reason: 'Password must be at least 8 characters.' };
    }
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
      // Don't show success message
    } catch (err) {
      setCurrentVerified(false);
      // Don't show error message
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
      setPwdMessage(null); // Don't show success message
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image/(png|jpeg|jpg)')) {
        setMessage('Please select a valid image file (PNG or JPEG)');
        setImagePreview(null);
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMessage('File size must be less than 2MB');
        setImagePreview(null);
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setMessage(null);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage('Please select an image file first.');
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // Upload the profile image
      if (employeeService.uploadEmployeeImage) {
        await employeeService.uploadEmployeeImage(currentUser.id, file);
        setMessage('Profile picture uploaded successfully!');
        
        // Clear the file input
        if (fileRef.current) {
          fileRef.current.value = '';
        }
        
        // Optionally refresh the page to show the new image
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage('Upload service not available.');
      }
    } catch (err) {
      console.error('Failed to upload profile picture', err);
      setMessage(err.message || 'Failed to upload profile picture');
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
          <input name="lastName" type="text" value={form.lastName || ''} readOnly disabled className={styles.readOnlyField} />
        </div>
        <div className={styles.fieldGroup}>
          <label>First Name</label>
          <input name="firstName" type="text" value={form.firstName || ''} readOnly disabled className={styles.readOnlyField} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Middle Name</label>
          <input name="middleName" type="text" value={form.middleName || ''} readOnly disabled className={styles.readOnlyField} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Suffix</label>
          <input name="suffix" type="text" value={form.suffix || ''} readOnly disabled className={styles.readOnlyField} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Company ID</label>
          <input name="companyId" type="text" value={form.companyId || ''} readOnly disabled className={styles.readOnlyField} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Department</label>
          <input name="department" type="text" value={form.department || ''} readOnly disabled className={styles.readOnlyField} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Role</label>
          <input name="role" type="text" value={form.role || ''} readOnly disabled className={styles.readOnlyField} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Email</label>
          <input name="email" type="email" value={form.email || ''} readOnly disabled className={styles.readOnlyField} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Upload Profile Picture</label>
          <input ref={fileRef} type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
          {imagePreview && (
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>Preview:</p>
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{ 
                  width: '150px', 
                  height: '150px', 
                  borderRadius: '8px', 
                  objectFit: 'cover',
                  border: '2px solid #e5e7eb'
                }} 
              />
            </div>
          )}
        </div>
        <button className={styles.saveButton} onClick={handleSave} disabled={saving || !imagePreview}>
          {saving ? 'Uploading...' : 'Upload Profile Picture'}
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
