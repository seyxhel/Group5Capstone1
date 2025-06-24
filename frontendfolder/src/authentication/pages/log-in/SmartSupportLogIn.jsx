import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import authService from "../../../utilities/service/authService";
import Alert from "../../../shared/alert/Alert";
import LoadingButton from "../../../shared/buttons/LoadingButton";

import { FaEye, FaEyeSlash } from "react-icons/fa";
import Logo from "../../../shared/assets/MapLogo.png";
import SmartSupportImage from "../../assets/SmartSupportImage.jpg";

import "./SmartSupportLogIn.css";

const SmartSupportLogIn = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [isShowPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm({ mode: "all" });

  const password = watch("password", "");

  const handleLogin = async ({ email, password }) => {
    setSubmitting(true);
    setErrorMessage("");

    let tokenData = null;
    let loginType = null;

    try {
      // Try employee endpoint first
      tokenData = await authService.loginEmployee(email, password);
      loginType = "employee";
    } catch (err) {
      // If employee login fails, try admin endpoint
      try {
        tokenData = await authService.loginAdmin(email, password);
        loginType = "admin";
      } catch (err2) {
        setErrorMessage("Invalid credentials.");
        setSubmitting(false);
        return;
      }
    }

    // Use tokenData fields directly
    const status = tokenData.status || "Approved"; // Default to Approved if not present

    if (["pending", "denied"].includes(status.toLowerCase())) {
      setErrorMessage("Your account is not approved yet. Please contact your administrator.");
      setSubmitting(false);
      return;
    }

    // Store tokens with different keys
    if (loginType === "admin") {
      localStorage.setItem("admin_access_token", tokenData.access);
      localStorage.setItem("admin_refresh_token", tokenData.refresh);
      localStorage.setItem("user_role", tokenData.role);
      navigate("/coordinator");
    } else {
      localStorage.setItem("employee_access_token", tokenData.access);
      localStorage.setItem("employee_refresh_token", tokenData.refresh);
      localStorage.setItem("user_role", tokenData.role);
      // Store first name and last name
      localStorage.setItem("employee_first_name", tokenData.first_name || "");
      localStorage.setItem("employee_last_name", tokenData.last_name || "");
      localStorage.setItem("employee_image", tokenData.image || "");
      navigate("/employee/home");
    }

    setSubmitting(false);
  };

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (!password) setShowPassword(false);
  }, [password]);

  return (
    <>
      {errorMessage && <Alert message={errorMessage} type="danger" />}

      <main className="login-page">
        <section className="left-panel">
          <img src={SmartSupportImage} alt="login illustration" className="asset-image" />
        </section>

        <section className="right-panel">
          <header className="form-header">
            <div className="logo">
              <img src={Logo} alt="logo" />
              <h1 className="logo-text">SmartSupport</h1>
            </div>
            <p>Welcome! Please provide your credentials to log in.</p>
          </header>

          <form onSubmit={handleSubmit(handleLogin)}>
            <fieldset>
              <label>Email:</label>
              {errors.email && <span>{errors.email.message || "Please fill in the required field"}</span>}
              <input
                type="text"
                placeholder="Enter your email"
                {...register("email", {
                  required: true,
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
                    message: "Invalid email format",
                  },
                })}
              />
            </fieldset>

            <fieldset>
              <label>Password:</label>
              {errors.password && <span>Please fill in the required field</span>}
              <div className="password-container">
                <input
                  type={isShowPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password", { required: true })}
                />
                {password && (
                  <span
                    className="show-password"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {isShowPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                )}
              </div>
            </fieldset>

            <button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting && <LoadingButton />}
              {isSubmitting ? "Verifying..." : "Log In"}
            </button>
          </form>

          <a onClick={() => navigate("/forgot-password")}>Forgot Password?</a>

          <p>
            Don’t have an account as an Employee?{" "}
            <span className="create-account-link" onClick={() => navigate("/create-account")}>
              Create account
            </span>
          </p>
        </section>
      </main>
    </>
  );
};

export default SmartSupportLogIn;
