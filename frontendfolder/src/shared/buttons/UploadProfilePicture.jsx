import { useEffect, useRef, useState } from "react";
import styles from "./UploadProfilePicture.module.css";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function UploadProfilePicture({ 
  register, 
  setValue, 
  watch, 
  errors, 
  touchedFields,
  triggerValidation 
}) {
  const [preview, setPreview] = useState(null);
  const [localError, setLocalError] = useState("");
  const fileInputRef = useRef(null);
  const fileList = watch("profileImage");

  useEffect(() => {
    const file = fileList?.[0];
    if (!file) {
      setPreview(null);
      setLocalError("");
      return;
    }

    const isValidType = ALLOWED_TYPES.includes(file.type);
    const isValidSize = file.size <= MAX_FILE_SIZE;

    if (!isValidType) {
      setLocalError("Only JPG, JPEG, and PNG formats are allowed.");
      handleRemoveImage(false);
      return;
    }
    if (!isValidSize) {
      setLocalError("Image must not exceed 2MB.");
      handleRemoveImage(false);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setLocalError("");
    // Cleanup preview URL on unmount
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line
  }, [fileList]);

  const handleRemoveImage = (clearInput = true) => {
    setValue("profileImage", null, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setPreview(null);
    if (clearInput && fileInputRef.current) fileInputRef.current.value = "";
    triggerValidation?.("profileImage");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = ALLOWED_TYPES.includes(file.type);
    const isValidSize = file.size <= MAX_FILE_SIZE;

    if (!isValidType) {
      setLocalError("Only JPG, JPEG, and PNG formats are allowed.");
      handleRemoveImage(false);
      return;
    }
    if (!isValidSize) {
      setLocalError("Image must not exceed 2MB.");
      handleRemoveImage(false);
      return;
    }

    // If valid, update form state
    const dt = new DataTransfer();
    dt.items.add(file);
    setValue("profileImage", dt.files, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setLocalError("");
    triggerValidation?.("profileImage");
  };

  return (
    <>
      <div className={styles.uploadWrapper}>
        {!preview && (
          <label className={styles.uploadButton}>
            Choose Profile Picture
            <input
              type="file"
              ref={fileInputRef}
              // accept="image/jpeg,image/jpg,image/png" // <-- Remove or comment out for testing all images
              className={styles.hiddenInput}
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {preview && (
        <div className={styles.previewContainer}>
          <img src={preview} alt="Preview" className={styles.imagePreview} />
          <button
            type="button"
            className={styles.removeButton}
            onClick={() => handleRemoveImage()}
          >
            &times;
          </button>
        </div>
      )}
      {(localError || (errors?.profileImage && touchedFields?.profileImage)) && (
        <span className={styles.errorMsg}>
          {localError || errors.profileImage.message}
        </span>
      )}
    </>
  );
}