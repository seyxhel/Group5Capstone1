import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { backendAuthService } from '../../../services/backend/authService';
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

    try {
      // Use backend auth (JWT). The backendAuthService will try both
      // /api/token/employee/ and /api/token/admin/ and return the token
      // response (including extra fields like `role` and `first_name`).
      const data = await backendAuthService.login({ email, password });

      if (!data) {
        setErrorMessage("Invalid credentials. Please try again.");
        return;
      }

      // Debug: log the response data to see what backend returns
      console.log('Login response data:', data);

      // Persist a frontend-friendly loggedInUser object so other parts
      // of the app (which read `loggedInUser`) keep working.
      const tokenUser = backendAuthService.getCurrentUser();
      const storedUser = {
        id: tokenUser?.id || null,
        email: tokenUser?.email || email,
        role: (data.role || '').trim() || null,
        firstName: data.first_name || '',
        middleName: data.middle_name || '',
        lastName: data.last_name || '',
        suffix: data.suffix || '',
        companyId: data.company_id || '',
        department: data.department || '',
      };
      
      // Debug: log what we're storing
      console.log('Storing user data:', storedUser);
      localStorage.setItem('loggedInUser', JSON.stringify(storedUser));

      const role = storedUser.role?.trim().toLowerCase();

      if (role === 'employee') {
        navigate('/employee/home');
      } else if (role === 'ticket coordinator' || role === 'system admin') {
        navigate('/admin/dashboard');
      } else {
        // If backend didn't return a role, fallback to JWT claims or show error
        setErrorMessage('Invalid user role. Please contact administrator.');
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
              {errors.email && (
                <span>{errors.email.message || "Please fill in the required field."}</span>
              )}
              <input
                type="text"
                placeholder="Enter your email"
                {...register("email", {
                  required: true,
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
                    message: "Invalid email format.",
                  },
                })}
              />
            </fieldset>

            <fieldset>
              <label>Password:</label>
              {errors.password && <span>Please fill in the required field.</span>}
              <div className="password-container">
                <input
                  type={isShowPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="off"
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
            Don't have an account as an Employee?{" "}
            <span className="create-account-link" onClick={() => navigate("/create-account")}>
              Create account
            </span>
          </p>
        </section>

        <div className="version-info">Version 1.0.0 &copy; 2025 SmartSupport</div>
      </main>
    </>
  );
};

export default SmartSupportLogIn;
