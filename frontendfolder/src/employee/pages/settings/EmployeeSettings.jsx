import { useEffect, useState } from "react";
import styles from './EmployeeSettings.module.css';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;
const MEDIA_URL = "https://smartsupport-hdts-backend.up.railway.app"; // For image preview

const EmployeeSettings = () => {
  const [profile, setProfile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("employee_access_token");
      if (!token) return;
      const res = await fetch(`${API_URL}employee/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setImagePreview(data.image ? `${MEDIA_URL}${data.image}` : null);
      }
    };
    fetchProfile();
  }, []);

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  // Upload profile image
  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) return;
    const token = localStorage.getItem("employee_access_token");
    const formData = new FormData();
    formData.append("image", imageFile);
    const res = await fetch(`${API_URL}employee/upload-image/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      setMessage("Profile image updated!");
      // Fetch the updated profile to get the new image filename
      const profileRes = await fetch(`${API_URL}employee/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
        setImagePreview(data.image ? `${MEDIA_URL}${data.image}` : null);
        setImageFile(null);
      }
    } else {
      setMessage("Failed to upload image.");
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage("New passwords do not match.");
      return;
    }
    const token = localStorage.getItem("employee_access_token");
    const res = await fetch(`${API_URL}employee/change-password/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: passwords.current,
        new_password: passwords.new,
      }),
    });
    if (res.ok) {
      setMessage("Password changed successfully.");
      setPasswords({ current: "", new: "", confirm: "" });
    } else {
      const data = await res.json();
      setMessage(data.detail || "Failed to change password.");
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Settings</h2>
      {message && <div className={styles.message}>{message}</div>}

      {/* Personal Information Section */}
      <div className={styles.section}>
        <h3>Personal Information</h3>
        <div className={styles.fieldGroup}>
          <label>Last Name</label>
          <input type="text" value={profile.last_name || ""} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>First Name</label>
          <input type="text" value={profile.first_name || ""} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Middle Name</label>
          <input type="text" value={profile.middle_name || ""} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Suffix</label>
          <input type="text" value={profile.suffix || ""} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Company ID</label>
          <input type="text" value={profile.company_id || ""} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Department</label>
          <input type="text" value={profile.department || ""} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Role</label>
          <input type="text" value={profile.role || ""} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label>Email</label>
          <input type="email" value={profile.email || ""} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="profile-image">Upload Profile Picture</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              id="profile-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ flex: "none" }}
            />
            <span className={styles.currentFileName}>
              {imageFile
                ? imageFile.name
                : profile?.image
                  ? profile.image.split("/").pop()
                  : "No file chosen"}
            </span>
          </div>
        </div>
        <button className={styles.saveButton} onClick={handleImageUpload}>Save Changes</button>
      </div>

      {/* Security Section */}
      <div className={styles.section}>
        <h3>Security</h3>
        <div className={styles.fieldGroup}>
          <label>Current Password</label>
          <input
            type="password"
            value={passwords.current}
            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>New Password</label>
          <input
            type="password"
            value={passwords.new}
            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>Confirm Password</label>
          <input
            type="password"
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
          />
        </div>
        <button className={styles.saveButton} onClick={handlePasswordChange}>Change Password</button>
      </div>
    </div>
  );
};

export default EmployeeSettings;
