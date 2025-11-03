import { useState, useEffect, useRef } from 'react';
import styles from './manage-profile.module.css';
import authService from '../../../utilities/service/authService';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../../../shared/components/Skeleton/Skeleton';
import { API_CONFIG } from '../../../config/environment';

export default function EmployeeSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileUrlRef = useRef(null);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      const u = authService.getCurrentUser();
      setUser(u);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup any blob URLs on unmount
  useEffect(() => {
    return () => {
      if (fileUrlRef.current) {
        try { URL.revokeObjectURL(fileUrlRef.current); } catch (e) {}
        fileUrlRef.current = null;
      }
    };
  }, []);

  const handleFileSelect = (file) => {
    setSelectedFile(file || null);
    if (file) {
      try {
        if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
      } catch (e) {}
      const url = URL.createObjectURL(file);
      fileUrlRef.current = url;
      setPreviewUrl(url);
    } else {
      try {
        if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
      } catch (e) {}
      fileUrlRef.current = null;
      setPreviewUrl(null);
    }
  };

  const handleSaveChanges = async () => {
    // Only change currently supported: profile image upload
    if (!selectedFile) {
      // No file selected; nothing to save
      return;
    }
    setUploading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Upload to backend
        const fd = new FormData();
        fd.append('image', selectedFile);
        const BASE_URL = API_CONFIG.BACKEND.BASE_URL;
        const resp = await fetch(`${BASE_URL}/api/employee/upload-image/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: fd,
        });

        if (!resp.ok) {
          let msg = 'Failed to upload profile image';
          try {
            const data = await resp.json();
            msg = data?.error || data?.detail || msg;
          } catch (e) {
            // ignore
          }
          throw new Error(msg);
        }

        const data = await resp.json().catch(() => ({}));
        // Server may return { image_url, employee } or similar
        const newImageUrl = data?.image_url || data?.image || previewUrl;
        // Update local user cache for immediate UI feedback
        setUser((prev) => ({ ...(prev || {}), profileImage: newImageUrl, image: newImageUrl }));
        try {
          const cached = authService.getCurrentUser();
          if (cached) {
            const updated = { ...cached, profileImage: newImageUrl, image: newImageUrl };
            localStorage.setItem('loggedInUser', JSON.stringify(updated));
          }
        } catch (e) {
          // ignore storage errors
        }
      } else {
        // Fallback: no backend token; store preview in local profile
        setUser((prev) => ({ ...(prev || {}), profileImage: previewUrl }));
        try {
          const cached = authService.getCurrentUser();
          if (cached) {
            const updated = { ...cached, profileImage: previewUrl };
            localStorage.setItem('loggedInUser', JSON.stringify(updated));
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('Save profile changes failed:', err);
      // Optionally show a toast here
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.manageProfilePage}>
        <div className={styles.manageProfileContainer}>
          <h1>Manage Profile</h1>
          <div className={styles.profileContent}>
            <div className={styles.profileLeft}>
              <div className={styles.profileCard}>
                <Skeleton width="120px" height="120px" borderRadius="50%" />
                <Skeleton width="200px" height="20px" style={{ marginTop: '12px' }} />
              </div>
            </div>
            <div className={styles.profileRight}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ marginBottom: '24px' }}>
                  <Skeleton width="150px" height="18px" />
                  {[1, 2].map(j => (
                    <Skeleton key={j} width="100%" height="36px" style={{ marginTop: '8px' }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className={styles.manageProfilePage}>
        <div className={styles.manageProfileContainer}>
          <h1>Manage Profile</h1>

          <div className={styles.profileContent}>
            <div className={styles.profileLeft}>
              <div className={styles.profileCard}>
                <div className={styles.profileImageSection}>
                  <div className={styles.profileImageContainer}>
                    <img
                      src={previewUrl || user?.profileImage || user?.profile_picture || "https://i.pinimg.com/736x/19/de/17/19de17c09737a59c5684e14cbaccdfc1.jpg"}
                      alt="Profile"
                      className={styles.profileImage}
                    />
                  </div>
                  <input
                    type="file"
                    id="profile-image-input"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      handleFileSelect(f);
                    }}
                  />
                  <label htmlFor="profile-image-input" className={styles.changeImageBtn}>
                    {selectedFile ? 'Change Photo (selected)' : 'Change Photo'}
                  </label>
                </div>

                <div className={styles.profileInfo}>
                  <h3>
                    {user?.firstName || user?.first_name} {user?.lastName || user?.last_name}
                  </h3>
                  <div className={styles.profileDetails}>
                    <p>
                      <strong>Position:</strong>
                    </p>
                    <p>{user?.position || user?.role || 'Not specified'}</p>
                    <p>
                      <strong>Department:</strong>
                    </p>
                    <p>{user?.department || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.profileRight}>
              <form>
                {/* Personal Information (restored fields) */}
                <div className={styles.profileSettingsCard}>
                  <h2>Personal Information</h2>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Last Name</label>
                      <input type="text" value={user?.lastName || user?.last_name || ''} readOnly />
                    </div>

                    <div className={styles.formGroup}>
                      <label>First Name</label>
                      <input type="text" value={user?.firstName || user?.first_name || ''} readOnly />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Middle Name</label>
                      <input type="text" value={user?.middleName || user?.middle_name || ''} readOnly />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Suffix</label>
                      <input type="text" value={user?.suffix || ''} readOnly />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Company ID</label>
                      <input type="text" value={user?.companyId || user?.company_id || ''} readOnly />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Department</label>
                      <input type="text" value={user?.department || ''} readOnly />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Role</label>
                      <input type="text" value={user?.role || ''} readOnly />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input type="email" value={user?.email || ''} readOnly />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Upload Profile Picture</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files && e.target.files[0])} />
                    </div>
                  </div>

                  <button className={styles.saveButton} type="button" onClick={handleSaveChanges} disabled={uploading}>{uploading ? 'Saving...' : 'Save Changes'}</button>
                </div>

                {/* Security Section (restored) */}
                <div className={styles.authenticationCard}>
                  <h2>Security</h2>
                  <div className={styles.formGroup}>
                    <label>Current Password (hashed)</label>
                    <input type="password" disabled value="••••••••••••••" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>New Password</label>
                    <input type="password" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Confirm Password</label>
                    <input type="password" />
                  </div>
                  <button className={styles.saveButton} type="button">Save New Password</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
