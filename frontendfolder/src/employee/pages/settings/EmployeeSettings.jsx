import { useState, useEffect, useRef } from 'react';
import styles from './manage-profile.module.css';
import authService from '../../../utilities/service/authService';
import { useNavigate } from 'react-router-dom';
import { backendEmployeeService } from '../../../services/backend/employeeService';
import { API_CONFIG, FEATURES } from '../../../config/environment.js';
import { toast } from 'react-toastify';

export default function EmployeeSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileUrlRef = useRef(null);

  useEffect(() => {
    const u = authService.getCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Cleanup object URL when component unmounts or when preview changes
    return () => {
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
        fileUrlRef.current = null;
      }
    };
  }, []);

  // Try to fetch the latest profile from the backend so the placeholder reflects the
  // server-side value (falls back to local authService user if backend not available)
  useEffect(() => {
    let mounted = true;

    const makeAbsolute = (img) => {
      if (!img) return null;
      if (/^https?:\/\//i.test(img)) return img;

      // Prefer configured media URL if present (Vite env) else use backend base URL
      const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || `${API_CONFIG.BACKEND.BASE_URL.replace(/\/$/, '')}/media/`;

      // If the image already looks like a media path (/media/...), normalize by prefixing MEDIA_URL
      if (img.startsWith('/media/') || img.startsWith('media/')) {
        const clean = img.replace(/^\/?media\//, '');
        return `${MEDIA_URL}${clean}`;
      }

      // If path starts with '/', prefix with backend base URL
      if (img.startsWith('/')) {
        const base = API_CONFIG.BACKEND.BASE_URL.replace(/\/$/, '');
        return `${base}${img}`;
      }

      // Otherwise treat it as a relative path under MEDIA_URL
      return `${MEDIA_URL}${img}`;
    };

    const fetchProfile = async () => {
      try {
        const data = await backendEmployeeService.getCurrentEmployee();
        if (!mounted || !data) return;

        // Try common image fields returned by different backends
        const image = data.profileImage || data.profile_image || data.image || data.url;
        const abs = makeAbsolute(image);
        if (abs) {
          // If no preview selected by user, show the server image as placeholder
          if (!selectedFile) setPreviewUrl(abs);
        }

        // Merge fetched data into user and persist it so other components can pick it up
        try {
          const merged = { ...(authService.getCurrentUser() || {}), ...data };
          setUser(merged);
          localStorage.setItem('loggedInUser', JSON.stringify(merged));
        } catch (e) {
          // Non-fatal — continue with local data
          console.debug('Could not persist fetched user data', e);
        }
      } catch (err) {
        // Backend may be unavailable in local/mock mode; keep existing local user
        console.debug('Could not fetch current employee profile:', err);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [selectedFile]);

  const handleSaveChanges = async () => {
    // If no new file selected, nothing to do
    if (!selectedFile) {
      toast.info('No changes to save.');
      return;
    }

    if (!user || !user.id) {
      toast.error('Unable to determine current user. Please log in again.');
      return;
    }

    setUploading(true);
    try {
      let updatedUser = { ...user };

      if (FEATURES && FEATURES.ENABLE_FILE_UPLOAD) {
        try {
          const result = await backendEmployeeService.uploadEmployeeImage(user.id, selectedFile);
          if (result) {
            if (result.employee && typeof result.employee === 'object') {
              updatedUser = { ...updatedUser, ...result.employee };
            } else if (result.user && typeof result.user === 'object') {
              updatedUser = { ...updatedUser, ...result.user };
            } else {
              const imageField = result.profileImage || result.image || result.profile_image || result.url;
              if (imageField) {
                updatedUser.profileImage = imageField;
                updatedUser.profile_image = imageField;
                updatedUser.image = imageField;
              }
            }
          }
        } catch (err) {
          console.warn('Upload failed, falling back to local storage image:', err);
          // fallback to local data-URL
          try {
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(selectedFile);
            });
            updatedUser.profileImage = dataUrl;
            updatedUser.profile_image = dataUrl;
            updatedUser.image = dataUrl;
            toast.info('Using local preview image since upload failed.');
          } catch (e) {
            console.warn('Failed to convert image to data URL for fallback:', e);
          }
        }
      } else {
        // File upload disabled (local dev mode) - persist preview as data URL
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
          updatedUser.profileImage = dataUrl;
          updatedUser.profile_image = dataUrl;
          updatedUser.image = dataUrl;
          toast.info('Profile image saved locally (development mode).');
        } catch (e) {
          console.warn('Failed to convert image to data URL for local save:', e);
          throw e;
        }
      }

      // Persist updated user in localStorage so navbar and other components can pick it up
      try {
        localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
      } catch (e) {
        console.warn('Failed to persist updated user to localStorage', e);
      }

      // Update preview immediately
      if (updatedUser.profileImage) setPreviewUrl(updatedUser.profileImage);

      toast.success('Profile image updated successfully.');

      // Give toast a moment to show, then reload so navbar/modal update
      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (err) {
      console.error('Failed to save image:', err);
      toast.error(err?.message || 'Failed to save image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (f) => {
    if (!f) return;
    const maxSize = 5 * 1024 * 1024;
    if (f.size > maxSize) {
      toast.error('Selected image is too large. Maximum size is 5MB.');
      return;
    }
    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
    }
    const url = URL.createObjectURL(f);
    fileUrlRef.current = url;
    setPreviewUrl(url);
    setSelectedFile(f);
  };

  if (loading) return <p>Loading...</p>;

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
