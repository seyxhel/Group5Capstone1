import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import LoadingButton from "../../../shared/buttons/LoadingButton";
import Logo from "../../../shared/assets/MapLogo.png";
import SmartSupportImage from "../../assets/SmartSupportImage.jpg";
import PrivacyPolicyTermsAndConditions from "../../components/PrivacyPolicyTermsAndConditions";
import styles from "./SmartSupportEmployeeCreateAccount.module.css";
import suffixOptions from "../../../utilities/options/suffixOptions";
import departmentOptions from "../../../utilities/options/departmentOptions";
import UploadProfilePicture from "../../../shared/buttons/UploadProfilePicture";

const namePattern = /^[a-zA-Z.\-'\s]+$/;
const letterPresencePattern = /[a-zA-Z]/;

const getPasswordErrorMessage = (password) => {
  if (!password || password.trim() === "") {
    return "Please fill in the required field.";
  }
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>`~\-_=\\/;'\[\]]/.test(password);

  const missing = {
    upper: !hasUpper,
    lower: !hasLower,
    digit: !hasDigit,
    special: !hasSpecial,
  };

  const missingKeys = Object.entries(missing)
    .filter(([_, isMissing]) => isMissing)
    .map(([key]) => key);

  const descriptors = {
    upper: "uppercase",
    lower: "lowercase",
    digit: "number",
    special: "special character",
  };

  const buildList = (items) => {
    if (items.length === 1) return descriptors[items[0]];
    if (items.length === 2)
      return `${descriptors[items[0]]} and ${descriptors[items[1]]}`;
    return (
      items
        .slice(0, -1)
        .map((key) => descriptors[key])
        .join(", ") +
      ", and " +
      descriptors[items[items.length - 1]]
    );
  };

  if (!hasMinLength && missingKeys.length) {
    return `Password must be at least 8 characters long and include ${buildList(
      missingKeys
    )}.`;
  } else if (!hasMinLength) {
    return "Password must be at least 8 characters long.";
  } else if (missingKeys.length) {
    return `Password must include ${buildList(missingKeys)}.`;
  }
};

export default function SmartSupportEmployeeCreateAccount() {
  const navigate = useNavigate();
  const [isSubmitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError, // <-- Add this
    watch,
    trigger,
    formState: { errors, isValid, touchedFields },
  } = useForm({
    mode: "all",
    defaultValues: {
      middleName: "",
      suffix: "",
      profileImage: undefined,
      terms: false, // <-- add this
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);

    // Get the file from UploadProfilePicture
    const profileImage = data.profileImage?.[0];
    if (!profileImage) {
      toast.error("Please upload a profile picture.");
      setSubmitting(false);
      return;
    }

    // Prepare form data for backend
    const formData = new FormData();
    formData.append("last_name", data.lastName);
    formData.append("first_name", data.firstName);
    formData.append("middle_name", data.middleName || "");
    formData.append("suffix", data.suffix || "");
    formData.append("company_id", `MA${data.companyId}`);
    formData.append("department", data.department);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("confirm_password", data.confirmPassword);
    formData.append("image", profileImage);

    try {
      const res = await fetch("http://localhost:8000/api/create_employee/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();

        // Field-specific error handling
        if (err.company_id) {
          setError("companyId", { type: "manual", message: err.company_id });
        }
        if (err.email) {
          setError("email", { type: "manual", message: err.email });
        }

        // Show a toast for general errors or if no field-specific error
        if (!err.company_id && !err.email) {
          toast.error(
            err.error ||
              err.message ||
              "Failed to create account. Please check your details."
          );
        }
        setSubmitting(false);
        return;
      }

      toast.success("Account created! Waiting for admin approval.");
      setSubmitting(false);
      setTimeout(() => navigate("/"), 3000);
    } catch (error) {
      toast.error("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const handleAgree = () => {
    setValue("terms", true, { shouldValidate: true });
    setShowModal(false);
  };
  const handleCancel = () => {
    setValue("terms", false, { shouldValidate: true });
    setShowModal(false);
  };

  const renderFieldset = (children, className = styles.fieldset) => (
    <fieldset className={className}>{children}</fieldset>
  );

  // Update renderInput to skip auto-uppercase for email
  const renderInput = (name, label, type = "text", rules = {}, placeholder = "") =>
    renderFieldset(
      <>
        <label>
          {label}
          {name !== "middleName" && <span className={styles.required}>*</span>}
        </label>
        <input
          type={type}
          className={styles.input}
          placeholder={placeholder}
          autoComplete="off"
          {...register(name, {
            required: name !== "middleName" && "Please fill in the required field.",
            ...rules,
            ...(name !== "email" && {
              onChange: (e) => {
                const value = e.target.value;
                const capitalized = value
                  ? value.charAt(0).toUpperCase() + value.slice(1)
                  : "";
                e.target.value = capitalized;
              },
            }),
          })}
          // For email, ensure no auto-uppercase handler is attached
          {...(name === "email" ? { onChange: undefined } : {})}
        />
        {errors[name] && <span className={styles.errorMsg}>{errors[name].message}</span>}
      </>
    );

  return (
    <main className={styles.container}>
      <section className={styles.leftPanel}>
        <img src={SmartSupportImage} alt="Create Account" className={styles.assetImage} />
      </section>

      <section className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <header className={styles.formHeader}>
            <div className={styles.logo}>
              <img src={Logo} alt="SmartSupport logo" />
              <h1 className={styles.logoText}>SmartSupport</h1>
            </div>
            <h2>Create Account</h2>
            <p className={styles.welcomeMessage}>
              Welcome! As an Employee, you can create your account below.
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {renderInput("lastName", "Last Name", "text", {
              required: "Please fill in the required field.",
              pattern: {
                value: namePattern,
                message: "Invalid character.",
              },
              validate: (v) =>
                letterPresencePattern.test(v) || "Invalid Last Name.",
            })}
            {renderInput("firstName", "First Name", "text", {
              required: "Please fill in the required field.",
              pattern: {
                value: namePattern,
                message: "Invalid character.",
              },
              validate: (v) =>
                letterPresencePattern.test(v) || "Invalid First Name.",
            })}
            {renderFieldset(
              <>
                <label>Middle Name</label>
                <input
                  type="text"
                  className={styles.input}
                  autoComplete="off"
                  {...register("middleName", {
                    validate: (v) =>
                      !v ||
                      (namePattern.test(v) && letterPresencePattern.test(v)) ||
                      (!namePattern.test(v)
                        ? "Invalid character."
                        : !letterPresencePattern.test(v)
                        ? "Invalid Middle Name."
                        : true),
                    onChange: (e) => {
                      const value = e.target.value;
                      const capitalized = value
                        ? value.charAt(0).toUpperCase() + value.slice(1)
                        : "";
                      e.target.value = capitalized;
                      return capitalized;
                    },
                  })}
                />
                {errors.middleName && <span className={styles.errorMsg}>{errors.middleName.message}</span>}
              </>
            )}

            {renderFieldset(
              <>
                <label>Suffix</label>
                <select className={styles.select} {...register("suffix")}>
                  <option value="">Select Suffix</option>
                  {suffixOptions.map((suffix) => (
                    <option key={suffix} value={suffix}>
                      {suffix}
                    </option>
                  ))}
                </select>
              </>
            )}

            {renderFieldset(
              <>
                <label>
                  Company ID <span className={styles.required}>*</span>
                </label>
                <div className={styles.companyIdGroup}>
                  <div className={styles.prefixWrapper}>
                    <span className={styles.companyIdPrefix}>MA</span>
                  </div>
                  <div className={styles.inputWrapper}>
                    <input
                      className={styles.companyIdInput}
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="0000"
                      autoComplete="off"
                      {...register("companyId", {
                        required: "Please fill in the required field.",
                        pattern: {
                          value: /^\d{4}$/,
                          message: "Invalid Company ID.",
                        },
                      })}
                    />
                  </div>
                </div>
                {errors.companyId && <span className={styles.errorMsg}>{errors.companyId.message}</span>}
              </>
            )}

            {renderFieldset(
              <>
                <label>
                  Department <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  {...register("department", {
                    required: "Please fill in the required field.",
                  })}
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.department && <span className={styles.errorMsg}>{errors.department.message}</span>}
              </>
            )}

            {/* Profile Picture Upload */}
            {renderFieldset(
              <>
                <label>
                  Upload Profile Picture <span className={styles.required}>*</span>
                </label>
                <UploadProfilePicture
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  errors={errors}
                  touchedFields={touchedFields}
                  triggerValidation={trigger}
                />
              </>
            )}

            {renderInput("email", "Email Address", "email", {
              required: "Please fill in the required field.",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
                message: "Invalid Email.",
              },
            }, "@gmail.com")}

            {renderFieldset(
              <>
                <label>
                  Password <span className={styles.required}>*</span>
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.input}
                    {...register("password", {
                      validate: (v) => getPasswordErrorMessage(v),
                    })}
                  />
                  <span
                    className={styles.showPassword}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {errors.password && <span className={styles.errorMsg}>{errors.password.message}</span>}
              </>
            )}

            {renderFieldset(
              <>
                <label>
                  Confirm Password <span className={styles.required}>*</span>
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={styles.input}
                    autoComplete="off"
                    {...register("confirmPassword", {
                      validate: (val) => val === watch("password") || "Password did not match.",
                    })}
                    onPaste={e => e.preventDefault()}
                  />
                  <span
                    className={styles.showPassword}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {errors.confirmPassword && <span className={styles.errorMsg}>{errors.confirmPassword.message}</span>}
              </>
            )}

            {renderFieldset(
              <>
                <label className={styles.checkboxWrapper}>
                  <input
                    type="checkbox"
                    checked={watch("terms")}
                    tabIndex={-1}
                    readOnly
                    {...register("terms", {
                      required: "Please fill in the required field.",
                    })}
                  />
                  &nbsp; I agree to the{" "}
                  <span className={styles.link} onClick={() => setShowModal(true)} role="button" tabIndex={0}>
                    Privacy Policy
                  </span>
                  <span> and </span>
                  <span className={styles.link} onClick={() => setShowModal(true)} role="button" tabIndex={0}>
                    Terms and Conditions
                  </span>
                  <span className={styles.required}>*</span>
                </label>
                {errors.terms && <span className={styles.errorMsg}>{errors.terms.message}</span>}
              </>
            )}

            <button type="submit" disabled={!isValid || isSubmitting} className={styles.button}>
              {isSubmitting ? <LoadingButton /> : "Sign Up"}
            </button>

            <p className={styles.backToLogin}>
              Already have an account? <span onClick={() => navigate("/")}>Log In</span>
            </p>
          </form>
        </div>
      </section>

      {showModal && (
        <PrivacyPolicyTermsAndConditions onAgree={handleAgree} onClose={handleCancel} />
      )}
    </main>
  );
}
