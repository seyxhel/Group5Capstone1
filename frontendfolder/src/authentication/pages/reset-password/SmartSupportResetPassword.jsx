import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const pwError = getPasswordErrorMessage(password);
    if (pwError) return setError(pwError);
    if (password !== confirm) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}employee/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uidb64, token, new_password: password }), // <-- send both
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
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            setError("");
          }}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={e => {
            setConfirm(e.target.value);
            setError("");
          }}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Changing..." : "Change Password"}
        </button>
      </form>
    </main>
  );
}