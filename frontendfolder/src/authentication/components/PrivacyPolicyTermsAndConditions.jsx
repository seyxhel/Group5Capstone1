import { useState } from "react";
import styles from "./PrivacyPolicyTermsAndConditions.module.css";

const PrivacyPolicyTermsAndConditions = ({ onAgree, onClose }) => {
  const [step, setStep] = useState("privacy");

  const isPrivacy = step === "privacy";
  const handleNext = () => setStep("terms");
  const handleAgree = () => onAgree?.();
  const handleCancel = () => onClose?.();

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.container}>
        <h2 className={styles.header}>
          {isPrivacy ? "Privacy Policy" : "Terms and Conditions"}
        </h2>

        <div className={styles.contentBox}>
          <p>
            {isPrivacy
              ? "This Privacy Policy explains how we collect, use, and protect your personal data..."
              : "By using this application, you agree to follow all applicable terms, including..."}
          </p>
        </div>

        <div className={styles.actions}>
          {isPrivacy ? (
            <button
              onClick={handleNext}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              Next
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className={`${styles.button} ${styles.buttonOutline}`}
              >
                Cancel
              </button>
              <button
                onClick={handleAgree}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                I Agree
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyTermsAndConditions;
