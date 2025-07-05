import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from './EmployeeSettings.module.css';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;
const MEDIA_URL = "https://smartsupport-hdts-backend.up.railway.app"; // For image preview

const getPasswordErrorMessage = (password) => {
  const requirements = [];
  if (!password || password.trim() === "") {
    return "Please fill in the required field.";
  }
  if (password.length < 8) {
    requirements.push("at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    requirements.push("an uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    requirements.push("a number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\[\]\\/~`+=;'-]/.test(password)) {
    requirements.push("a special character");
  }
  if (requirements.length > 0) {
    if (requirements.length === 1) {
      return `Password must contain ${requirements[0]}.`;
    }
    const last = requirements.pop();
    return `Password must contain ${requirements.join(", ")}, and ${last}.`;
  }
  return "";
};

const EmployeeSettings = () => {
  const [profile, setProfile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [message, setMessage] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Error states for each field
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Track if user has touched (focused and blurred) each field
  const [touched, setTouched] = useState({
    current: false,
    new: false,
    confirm: false,
  });

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

  // Validate fields on change
  useEffect(() => {
    // Current password
    setCurrentPasswordError(
      !passwords.current ? "Please fill in the required field." : ""
    );
    // New password
    setNewPasswordError(getPasswordErrorMessage(passwords.new));
    // Confirm password
    setConfirmPasswordError(
      !passwords.confirm
        ? "Please fill in the required field."
        : passwords.new && passwords.confirm !== passwords.new
        ? "New passwords do not match."
        : ""
    );
  }, [passwords]);

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    // Validate again before submit
    if (
      currentPasswordError ||
      newPasswordError ||
      confirmPasswordError ||
      !passwords.current ||
      !passwords.new ||
      !passwords.confirm
    ) {
      return;
    }
    setMessage("");
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

  const isChangePasswordDisabled =
    !passwords.current ||
    !passwords.new ||
    !passwords.confirm ||
    !!currentPasswordError ||
    !!newPasswordError ||
    !!confirmPasswordError;

  if (!profile) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Settings</h2>
      {message && message !== "Current password is incorrect." && (
  <div className={styles.message}>{message}</div>
)}

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
        {/* Current Password */}
        <div className={styles.fieldGroup}>
          <label>
            Current Password <span className={styles.required}>*</span>
          </label>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showCurrent ? "text" : "password"}
              value={passwords.current}
              onChange={(e) =>
                setPasswords({ ...passwords, current: e.target.value })
              }
              onBlur={() => setTouched((prev) => ({ ...prev, current: true }))}
              style={{ width: "100%", paddingRight: "40px" }}
            />
            {passwords.current && (
              <span
                style={{
                  position: "absolute",
                  right: "18px",
                  top: "50%",
                  transform: "translateY(-40%)",
                  cursor: "pointer"
                }}
                onClick={() => setShowCurrent((prev) => !prev)}
              >
                {showCurrent ? <FaEyeSlash /> : <FaEye />}
              </span>
            )}
          </div>
          {touched.current && currentPasswordError && (
            <span className={styles.errorMessage}>{currentPasswordError}</span>
          )}
          {/* Show backend error for current password */}
          {message === "Current password is incorrect." && (
            <span className={styles.errorMessage}>{message}</span>
          )}
        </div>
        {/* New Password */}
        <div className={styles.fieldGroup}>
          <label>
            New Password <span className={styles.required}>*</span>
          </label>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showNew ? "text" : "password"}
              value={passwords.new}
              onChange={(e) => {
                const value = e.target.value;
                setPasswords({ ...passwords, new: value });
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, new: true }))}
              style={{ width: "100%", paddingRight: "40px" }}
            />
            {passwords.new && (
              <span
                style={{
                  position: "absolute",
                  right: "18px",
                  top: "50%",
                  transform: "translateY(-40%)",
                  cursor: "pointer"
                }}
                onClick={() => setShowNew((prev) => !prev)}
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </span>
            )}
          </div>
          {touched.new && newPasswordError && (
            <span className={styles.errorMessage}>{newPasswordError}</span>
          )}
        </div>
        {/* Confirm Password */}
        <div className={styles.fieldGroup}>
          <label>
            Confirm Password <span className={styles.required}>*</span>
          </label>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showConfirm ? "text" : "password"}
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords({ ...passwords, confirm: e.target.value })
              }
              onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
              onPaste={e => e.preventDefault()} // <-- Prevent paste
              style={{ width: "100%", paddingRight: "40px" }}
            />
            {passwords.confirm && (
              <span
                style={{
                  position: "absolute",
                  right: "18px",
                  top: "50%",
                  transform: "translateY(-40%)",
                  cursor: "pointer"
                }}
                onClick={() => setShowConfirm((prev) => !prev)}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            )}
          </div>
          {touched.confirm && confirmPasswordError && (
            <span className={styles.errorMessage}>{confirmPasswordError}</span>
          )}
        </div>
        <button
          className={styles.saveButton}
          onClick={handlePasswordChange}
          disabled={
            !passwords.current ||
            !passwords.new ||
            !passwords.confirm
          }
        >
          Change Password
        </button>
      </div>
    </div>
  );
};

export default EmployeeSettings;
