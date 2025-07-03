import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./SmartSupportResetPassword.module.css";

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
  if (!/[!@#$%^&*(),.?":{}|<>_\\[\]\\/~`+=;'-]/.test(password)) {
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

export default function SmartSupportResetPassword() {
  const { uidb64, token } = useParams(); // <-- use both
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const handlePasswordChange = (value) => {
    setPassword(value);
    const error = getPasswordErrorMessage(value);
    setPasswordError(error);
    // Also re-validate confirm field if it's not empty
    if (confirm && value !== confirm) {
      setConfirmError("Passwords do not match.");
    } else {
      setConfirmError("");
    }
  };

  const handleConfirmChange = (value) => {
    setConfirm(value);
    if (password !== value) {
      setConfirmError("Passwords do not match.");
    } else {
      setConfirmError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const pwError = getPasswordErrorMessage(password);
    setPasswordError(pwError);
    if (pwError) return;

    if (password !== confirm) {
      setConfirmError("Passwords do not match.");
      return;
    }
    setConfirmError("");

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}employee/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uidb64, token, new_password: password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Password changed successfully. You may now log in.");
        setTimeout(() => navigate("/"), 3000);
      } else {
        setError(data.detail || "Invalid or expired link.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <main className={styles.resetPage}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Set a New Password</h2>
        {error && <span className={styles.errorMsg}>{error}</span>}
        {success && <span className={styles.successMsg}>{success}</span>}

        <div className={styles.fieldGroup}>
          <label>New Password</label>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showNew ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={e => handlePasswordChange(e.target.value)}
              style={{ width: "100%", paddingRight: "40px" }}
            />
            {password && (
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
          {passwordError && <span className={styles.errorMsg}>{passwordError}</span>}
        </div>

        <div className={styles.fieldGroup}>
          <label>Confirm Password</label>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => handleConfirmChange(e.target.value)}
              style={{ width: "100%", paddingRight: "40px" }}
            />
            {confirm && (
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
          {confirmError && <span className={styles.errorMsg}>{confirmError}</span>}
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Changing..." : "Change Password"}
        </button>
      </form>
    </main>
  );
}