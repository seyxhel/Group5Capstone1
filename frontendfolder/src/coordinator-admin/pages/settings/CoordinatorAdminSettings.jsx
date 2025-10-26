import { useState, useEffect } from 'react';
import styles from './manage-profile.module.css';
import authService from '../../../utilities/service/authService';
import { backendEmployeeService } from '../../../services/backend/employeeService';
import { convertToSecureUrl, getAccessToken } from '../../../utilities/secureMedia';
import { useNavigate } from 'react-router-dom';

export default function CoordinatorAdminSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const local = authService.getCurrentUser();
      // Prefer live backend profile when an access token exists
      try {
        const token = getAccessToken();
        if (token) {
          const remote = await backendEmployeeService.getCurrentEmployee();
          // convert remote image to secure URL when possible
          const secureImage = convertToSecureUrl(remote?.image) || convertToSecureUrl(remote?.profile_image) || remote?.image || remote?.profile_image;
          setUser({ ...local, ...remote, profileImage: secureImage });
        } else {
          setUser(local);
        }
      } catch (err) {
        // fallback to local stored user when backend call fails
        setUser(local);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      // Upload using backend service (endpoint expects auth and uses current user)
      const result = await backendEmployeeService.uploadEmployeeImage(user?.id, file);

      // If server returned an image path, update the displayed image. Otherwise re-fetch profile.
      const newImage = result?.image || result?.profile_image || result?.profileImage;
      if (newImage) {
        const secure = convertToSecureUrl(newImage) || newImage;
        setUser((u) => ({ ...(u || {}), profileImage: secure }));
      } else {
        // re-fetch current employee to get updated image
        try {
          const refreshed = await backendEmployeeService.getCurrentEmployee();
          const secureRef = convertToSecureUrl(refreshed?.image) || convertToSecureUrl(refreshed?.profile_image) || refreshed?.image || refreshed?.profile_image;
          setUser((u) => ({ ...(u || {}), ...refreshed, profileImage: secureRef }));
        } catch (_) {
          // ignore -- leave current
        }
      }
    } catch (uploadErr) {
      console.error('Image upload failed', uploadErr);
      // optionally show toast in future
    }
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
                      src={user?.profileImage || user?.profile_picture || "https://i.pinimg.com/736x/19/de/17/19de17c09737a59c5684e14cbaccdfc1.jpg"}
                      alt="Profile"
                      className={styles.profileImage}
                    />
                  </div>
                  <input
                    type="file"
                    id="profile-image-input"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  <label htmlFor="profile-image-input" className={styles.changeImageBtn}>
                    Change Photo
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
                <div className={styles.profileSettingsCard}>
                  <h2>Profile Settings</h2>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>First Name</label>
                      <input type="text" name="first_name" value={user?.firstName || user?.first_name || ''} readOnly />
                    </div>

                    {/* Company / Employee ID removed from profile per admin UX requirements */}

                    <div className={styles.formGroup}>
                      <label>Middle Name</label>
                      <input type="text" name="middle_name" value={user?.middleName || user?.middle_name || ''} readOnly />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Department</label>
                      <input type="text" name="department" value={user?.department || ''} readOnly />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Last Name</label>
                      <input type="text" name="last_name" value={user?.lastName || user?.last_name || ''} readOnly />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Suffix</label>
                      <input type="text" name="suffix" value={user?.suffix || ''} readOnly />
                    </div>
                  </div>

                  <button type="button" className={styles.saveChangesBtn} onClick={() => {}}>
                    SAVE CHANGES
                  </button>
                </div>

                <div className={styles.authenticationCard}>
                  <h2>Authentication Details</h2>

                  <div className={styles.formGroup}>
                    <label>Email Address</label>
                    <input type="email" name="email" value={user?.email || ''} readOnly />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Password</label>
                    <input type="password" name="password" value="" placeholder="••••••••" readOnly />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
