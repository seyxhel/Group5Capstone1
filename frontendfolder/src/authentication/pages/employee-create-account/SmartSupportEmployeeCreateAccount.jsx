import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { apiService } from "../../../services/apiService";
import LoadingButton from "../../../shared/buttons/LoadingButton";
import Logo from "../../../shared/assets/MapLogo.png";
import SmartSupportImage from "../../assets/SmartSupportImage.jpg";
import UploadProfilePicture from "../../../shared/buttons/UploadProfilePicture";
import PrivacyPolicyTermsAndConditions from "../../components/PrivacyPolicyTermsAndConditions";

import styles from "./SmartSupportEmployeeCreateAccount.module.css";
import suffixOptions from "../../../utilities/options/suffixOptions";
import departmentOptions from "../../../utilities/options/departmentOptions";

export default function SmartSupportEmployeeCreateAccount() {
  const navigate = useNavigate();
  const [isSubmitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, touchedFields },
  } = useForm({ mode: "all" });

  const agreed = watch("terms");

  const onSubmit = async (data) => {
    setSubmitting(true);
    
    try {
      console.log('Raw form data:', data);
      
      // Prepare the data for the backend API
      const userData = {
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword, // Add confirm password field
        first_name: data.firstName,
        last_name: data.lastName,
        middle_name: data.middleName || '',
        suffix: data.suffix || '',
        company_id: `MA${data.companyId}`, // Combine prefix with company ID
        department: data.department,
        // Add any other fields that your backend expects
      };

      console.log('Creating account with data:', userData);
      console.log('JSON stringified data:', JSON.stringify(userData));
      
      // If a profile image was selected via the UploadProfilePicture component,
      // include the first File in the payload so the auth service can send
      // multipart FormData. The UploadProfilePicture registers 'profileImage'
      // as a FileList.
      const profileFiles = data.profileImage;
      if (profileFiles && profileFiles.length > 0) {
        userData.profileImage = profileFiles[0];
      }

      // Call the backend API
      const response = await apiService.auth.register(userData);

      console.log('Account creation response:', response);
      // If backend returned the created employee object, persist it to localStorage
      if (response && response.employee) {
        // Normalize image field: EmployeeSerializer typically returns image as a URL string
        const profile = response.employee;
        // Save profile under the same key the app expects
        localStorage.setItem('loggedInUser', JSON.stringify(profile));
      }

      toast.success("Account created successfully! Waiting for admin approval.");

      // Redirect to home page after successful registration
      setTimeout(() => navigate("/"), 2000);
      
    } catch (error) {
      console.error('Account creation error:', error);
      toast.error(error.message || "Failed to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgree = () => {
    setValue("terms", true, { shouldValidate: true });
    setShowModal(false);
  };

  const handleCancel = () => {
    setValue("terms", false);
    setShowModal(false);
  };

  const renderFieldset = (children, className = styles.fieldset) => (
    <fieldset className={className}>{children}</fieldset>
  );

  const renderInput = (name, label, type = "text", rules = {}) =>
    renderFieldset(
      <>
        <label>
          {label} <span className={styles.required}>*</span>
        </label>
        <input
          type={type}
          className={styles.input}
          {...register(name, {
            required: "Please fill in the required field.",
            ...rules,
          })}
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
            {renderInput("lastName", "Last Name")}
            {renderInput("firstName", "First Name")}
            {renderInput("middleName", "Middle Name")}

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
                      {...register("companyId", {
                        required: "Please fill in the required field.",
                        pattern: {
                          value: /^\d{4}$/,
                          message: "Please enter exactly 4 digits.",
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
                />
              </>
            )}

            {renderInput("email", "Email Address", "email", {
              validate: (v) =>
                /^[a-z0-9._%+-]+@gmail\.com$/i.test(v) || "Email must be a valid Gmail address",
            })}

            {renderInput("password", "Password", "password", {
              minLength: { value: 8, message: "At least 8 characters" },
              validate: {
                hasUpper: (v) => /[A-Z]/.test(v) || "Must include uppercase",
                hasLower: (v) => /[a-z]/.test(v) || "Must include lowercase",
                hasNumber: (v) => /\d/.test(v) || "Must include number",
                hasSpecial: (v) => /[!@#$%^&*]/.test(v) || "Must include special character",
              },
            })}

            {renderInput("confirmPassword", "Confirm Password", "password", {
              validate: (val) => val === watch("password") || "Password did not match.",
            })}

            {renderFieldset(
              <>
                <label className={styles.checkboxWrapper}>
                  <input
                    type="checkbox"
                    {...register("terms", {
                      required: "Accept the Privacy Policy and Terms and Conditions.",
                    })}
                    checked={agreed}
                    onChange={(e) =>
                      setValue("terms", e.target.checked, { shouldValidate: true })
                    }
                  />
                  &nbsp; I agree to the{" "}
                  <span className={styles.link} onClick={() => setShowModal(true)}>
                    Privacy Policy and Terms and Conditions
                  </span>{" "}
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
