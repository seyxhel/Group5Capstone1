import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=4730de81"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
var _s = $RefreshSig$();
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=4730de81"; const useState = __vite__cjsImport3_react["useState"];
import { useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=4730de81";
import { toast } from "/node_modules/.vite/deps/react-toastify.js?v=4730de81";
import Breadcrumb from "/src/shared/components/Breadcrumb.jsx";
import FormCard from "/src/shared/components/FormCard.jsx";
import InputField from "/src/shared/components/InputField.jsx";
import ProfileImageUpload from "/src/shared/components/ProfileImageUpload.jsx";
import Button from "/src/shared/components/Button.jsx";
import styles from "/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.module.css";
import formActions from "/src/shared/styles/formActions.module.css";
import FormActions from "/src/shared/components/FormActions.jsx";
import { getEmployeeUsers, addEmployeeUser } from "/src/utilities/storages/employeeUserStorage.js";
import { API_CONFIG } from "/src/config/environment.js";
const departments = [
  "IT Department",
  "Asset Department",
  "Budget Department"
];
const roles = [
  "Ticket Coordinator",
  "System Admin"
];
const CoordinatorAdminAccountRegister = () => {
  _s();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    suffix: "",
    department: "",
    role: "",
    email: ""
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validateField = (field, value) => {
    let error = "";
    switch (field) {
      case "lastName":
        if (!value.trim()) {
          error = "Last Name is required";
        } else if (value.trim().length < 2) {
          error = "Last Name must be at least 2 characters";
        }
        break;
      case "firstName":
        if (!value.trim()) {
          error = "First Name is required";
        } else if (value.trim().length < 2) {
          error = "First Name must be at least 2 characters";
        }
        break;
      case "middleName":
        break;
      case "suffix":
        break;
      case "department":
        if (!value) {
          error = "Department is required";
        }
        break;
      case "role":
        if (!value) {
          error = "Role is required";
        }
        break;
      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Invalid email format";
        } else {
          const existingUsers = getEmployeeUsers();
          if (existingUsers.some((user) => user.email === value.trim())) {
            error = "Email already exists";
          }
        }
        break;
      default:
        break;
    }
    return error;
  };
  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      [field]: value
    });
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({
        ...errors,
        [field]: error
      });
    }
    if (field === "password" && touched.confirmPassword) {
      const confirmError = validateField("confirmPassword", formData.confirmPassword);
      setErrors({
        ...errors,
        password: validateField("password", value),
        confirmPassword: confirmError
      });
    }
  };
  const handleBlur = (field) => () => {
    setTouched({
      ...touched,
      [field]: true
    });
    const error = validateField(field, formData[field]);
    setErrors({
      ...errors,
      [field]: error
    });
  };
  const validateAllFields = () => {
    const newErrors = {};
    const newTouched = {};
    const fieldsToValidate = [
      "lastName",
      "firstName",
      "middleName",
      "suffix",
      "department",
      "role",
      "email"
    ];
    fieldsToValidate.forEach((field) => {
      newTouched[field] = true;
      newErrors[field] = validateField(field, formData[field]);
    });
    if (formData.profileImage) {
      newTouched.profileImage = true;
      newErrors.profileImage = validateField("profileImage", formData.profileImage);
    }
    setTouched(newTouched);
    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAllFields()) {
      toast.error("Please fix the errors in the form before submitting.");
      return;
    }
    try {
      const token = localStorage.getItem("admin_access_token");
      const payload = {
        last_name: formData.lastName.trim(),
        first_name: formData.firstName.trim(),
        middle_name: formData.middleName.trim(),
        suffix: formData.suffix.trim(),
        department: formData.department,
        role: formData.role,
        email: formData.email.trim()
      };
      const res = await fetch(`${API_CONFIG.BACKEND.BASE_URL}/api/admin/create-employee/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || err.message || "Failed to create user account.");
        setIsSubmitting(false);
        return;
      }
      toast.success("User account created and approved successfully!");
      setTimeout(() => navigate("/admin/user-access/all-users"), 1500);
    } catch (error) {
      toast.error("Failed to create user account. Please try again.");
      setIsSubmitting(false);
    }
  };
  const resetForm = () => {
    setFormData({
      lastName: "",
      firstName: "",
      middleName: "",
      suffix: "",
      department: "",
      role: "",
      email: ""
    });
    setErrors({});
    setTouched({});
  };
  return /* @__PURE__ */ jsxDEV("main", { className: styles.registration, children: [
    /* @__PURE__ */ jsxDEV(
      Breadcrumb,
      {
        root: "User Management",
        currentPage: "Create Account",
        rootNavigatePage: "/admin/user-access/all-users",
        title: "Create New User Account"
      },
      void 0,
      false,
      {
        fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
        lineNumber: 248,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("section", { children: /* @__PURE__ */ jsxDEV(FormCard, { children: /* @__PURE__ */ jsxDEV("form", { onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsxDEV("fieldset", { children: [
        /* @__PURE__ */ jsxDEV("legend", { className: styles.fieldsetLegend, children: "Personal Information" }, void 0, false, {
          fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
          lineNumber: 259,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV(
          InputField,
          {
            label: "Last Name",
            placeholder: "Enter last name",
            value: formData.lastName,
            onChange: handleInputChange("lastName"),
            onBlur: handleBlur("lastName"),
            required: true,
            error: errors.lastName
          },
          void 0,
          false,
          {
            fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
            lineNumber: 262,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          InputField,
          {
            label: "First Name",
            placeholder: "Enter first name",
            value: formData.firstName,
            onChange: handleInputChange("firstName"),
            onBlur: handleBlur("firstName"),
            required: true,
            error: errors.firstName
          },
          void 0,
          false,
          {
            fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
            lineNumber: 271,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          InputField,
          {
            label: "Middle Name",
            placeholder: "Enter middle name",
            value: formData.middleName,
            onChange: handleInputChange("middleName"),
            onBlur: handleBlur("middleName"),
            error: errors.middleName
          },
          void 0,
          false,
          {
            fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
            lineNumber: 280,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          InputField,
          {
            label: "Suffix",
            placeholder: "e.g., Jr., Sr., III",
            value: formData.suffix,
            onChange: handleInputChange("suffix"),
            onBlur: handleBlur("suffix"),
            error: errors.suffix
          },
          void 0,
          false,
          {
            fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
            lineNumber: 288,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
        lineNumber: 258,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("fieldset", { children: [
        /* @__PURE__ */ jsxDEV("legend", { className: styles.fieldsetLegend, children: "Department" }, void 0, false, {
          fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
          lineNumber: 299,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: styles.formGroup, children: [
          /* @__PURE__ */ jsxDEV("label", { className: styles.formLabel, children: [
            "Department ",
            /* @__PURE__ */ jsxDEV("span", { className: styles.required, children: "*" }, void 0, false, {
              fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
              lineNumber: 304,
              columnNumber: 30
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
            lineNumber: 303,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              value: formData.department,
              onChange: handleInputChange("department"),
              onBlur: handleBlur("department"),
              className: errors.department ? styles.inputError : "",
              children: [
                /* @__PURE__ */ jsxDEV("option", { value: "", children: "Select Department" }, void 0, false, {
                  fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
                  lineNumber: 312,
                  columnNumber: 19
                }, this),
                departments.map(
                  (dept) => /* @__PURE__ */ jsxDEV("option", { value: dept, children: dept }, dept, false, {
                    fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
                    lineNumber: 314,
                    columnNumber: 19
                  }, this)
                )
              ]
            },
            void 0,
            true,
            {
              fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
              lineNumber: 306,
              columnNumber: 17
            },
            this
          ),
          errors.department && /* @__PURE__ */ jsxDEV("div", { className: styles.errorMessage, children: errors.department }, void 0, false, {
            fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
            lineNumber: 318,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
          lineNumber: 302,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
        lineNumber: 298,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("fieldset", { children: [
        /* @__PURE__ */ jsxDEV("legend", { className: styles.fieldsetLegend, children: "Role & Account Information" }, void 0, false, {
          fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
          lineNumber: 326,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: styles.formGroup, children: [
          /* @__PURE__ */ jsxDEV("label", { className: styles.formLabel, children: [
            "Role ",
            /* @__PURE__ */ jsxDEV("span", { className: styles.required, children: "*" }, void 0, false, {
              fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
              lineNumber: 331,
              columnNumber: 24
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
            lineNumber: 330,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              value: formData.role,
              onChange: handleInputChange("role"),
              onBlur: handleBlur("role"),
              className: errors.role ? styles.inputError : "",
              children: [
                /* @__PURE__ */ jsxDEV("option", { value: "", children: "Select Role" }, void 0, false, {
                  fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
                  lineNumber: 339,
                  columnNumber: 19
                }, this),
                roles.map(
                  (role) => /* @__PURE__ */ jsxDEV("option", { value: role, children: role }, role, false, {
                    fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
                    lineNumber: 341,
                    columnNumber: 19
                  }, this)
                )
              ]
            },
            void 0,
            true,
            {
              fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
              lineNumber: 333,
              columnNumber: 17
            },
            this
          ),
          errors.role && /* @__PURE__ */ jsxDEV("div", { className: styles.errorMessage, children: errors.role }, void 0, false, {
            fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
            lineNumber: 345,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
          lineNumber: 329,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV(
          InputField,
          {
            type: "email",
            label: "Email Address",
            placeholder: "e.g., user@example.com",
            value: formData.email,
            onChange: handleInputChange("email"),
            onBlur: handleBlur("email"),
            required: true,
            error: errors.email
          },
          void 0,
          false,
          {
            fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
            lineNumber: 350,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
        lineNumber: 325,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV(
        FormActions,
        {
          onCancel: () => navigate("/admin/user-access/all-users"),
          cancelLabel: "Cancel",
          submitLabel: isSubmitting ? "Creating..." : "Create Account",
          submitDisabled: isSubmitting,
          submitVariant: "primary"
        },
        void 0,
        false,
        {
          fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
          lineNumber: 362,
          columnNumber: 13
        },
        this
      )
    ] }, void 0, true, {
      fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
      lineNumber: 256,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
      lineNumber: 255,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
      lineNumber: 254,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx",
    lineNumber: 247,
    columnNumber: 5
  }, this);
};
_s(CoordinatorAdminAccountRegister, "EHfU1zhH6zPxXiZ+TatLN0JmAbI=", false, function() {
  return [useNavigate];
});
_c = CoordinatorAdminAccountRegister;
export default CoordinatorAdminAccountRegister;
var _c;
$RefreshReg$(_c, "CoordinatorAdminAccountRegister");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/Nadine San Juan/Desktop/Capstone 2/Group5Capstone1/frontendfolder/src/coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister.jsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,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QW1DQTtBQUFBLE1BRUE7QUFBQSxRQUFDO0FBQUE7QUFBQSxVQUNDLFVBQVUsTUFBTVQsU0FBUyw4QkFBOEI7QUFBQSxVQUN2RCxhQUFZO0FBQUEsVUFDWixhQUFhYyxlQUFlLGdCQUFnQjtBQUFBLFVBQzVDLGdCQUFnQkE7QUFBQUEsVUFDaEIsZUFBYztBQUFBO0FBQUEsUUFMaEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BS3lCO0FBQUEsU0EvRzNCO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FpSEEsS0FsSEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQW1IQSxLQXBIRjtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBcUhBO0FBQUEsT0E1SEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQTZIQTtBQUVKO0FBQUVmLEdBelVJRCxpQ0FBK0I7QUFBQSxVQUNsQmYsV0FBVztBQUFBO0FBQUE0RixLQUR4QjdFO0FBMlVOLGVBQWVBO0FBQWdDLElBQUE2RTtBQUFBQyxhQUFBRCxJQUFBIiwibmFtZXMiOlsidXNlU3RhdGUiLCJ1c2VOYXZpZ2F0ZSIsInRvYXN0IiwiQnJlYWRjcnVtYiIsIkZvcm1DYXJkIiwiSW5wdXRGaWVsZCIsIlByb2ZpbGVJbWFnZVVwbG9hZCIsIkJ1dHRvbiIsInN0eWxlcyIsImZvcm1BY3Rpb25zIiwiRm9ybUFjdGlvbnMiLCJnZXRFbXBsb3llZVVzZXJzIiwiYWRkRW1wbG95ZWVVc2VyIiwiQVBJX0NPTkZJRyIsImRlcGFydG1lbnRzIiwicm9sZXMiLCJDb29yZGluYXRvckFkbWluQWNjb3VudFJlZ2lzdGVyIiwiX3MiLCJuYXZpZ2F0ZSIsImZvcm1EYXRhIiwic2V0Rm9ybURhdGEiLCJsYXN0TmFtZSIsImZpcnN0TmFtZSIsIm1pZGRsZU5hbWUiLCJzdWZmaXgiLCJkZXBhcnRtZW50Iiwicm9sZSIsImVtYWlsIiwiZXJyb3JzIiwic2V0RXJyb3JzIiwidG91Y2hlZCIsInNldFRvdWNoZWQiLCJpc1N1Ym1pdHRpbmciLCJzZXRJc1N1Ym1pdHRpbmciLCJ2YWxpZGF0ZUZpZWxkIiwiZmllbGQiLCJ2YWx1ZSIsImVycm9yIiwidHJpbSIsImxlbmd0aCIsInRlc3QiLCJleGlzdGluZ1VzZXJzIiwic29tZSIsInVzZXIiLCJoYW5kbGVJbnB1dENoYW5nZSIsImUiLCJ0YXJnZXQiLCJjb25maXJtUGFzc3dvcmQiLCJjb25maXJtRXJyb3IiLCJwYXNzd29yZCIsImhhbmRsZUJsdXIiLCJ2YWxpZGF0ZUFsbEZpZWxkcyIsIm5ld0Vycm9ycyIsIm5ld1RvdWNoZWQiLCJmaWVsZHNUb1ZhbGlkYXRlIiwiZm9yRWFjaCIsInByb2ZpbGVJbWFnZSIsIk9iamVjdCIsInZhbHVlcyIsImhhbmRsZVN1Ym1pdCIsInByZXZlbnREZWZhdWx0IiwidG9rZW4iLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwicGF5bG9hZCIsImxhc3RfbmFtZSIsImZpcnN0X25hbWUiLCJtaWRkbGVfbmFtZSIsInJlcyIsImZldGNoIiwiQkFDS0VORCIsIkJBU0VfVVJMIiwibWV0aG9kIiwiaGVhZGVycyIsImJvZHkiLCJKU09OIiwic3RyaW5naWZ5Iiwib2siLCJlcnIiLCJqc29uIiwibWVzc2FnZSIsInN1Y2Nlc3MiLCJzZXRUaW1lb3V0IiwicmVzZXRGb3JtIiwicmVnaXN0cmF0aW9uIiwiZmllbGRzZXRMZWdlbmQiLCJmb3JtR3JvdXAiLCJmb3JtTGFiZWwiLCJyZXF1aXJlZCIsImlucHV0RXJyb3IiLCJtYXAiLCJkZXB0IiwiZXJyb3JNZXNzYWdlIiwiX2MiLCIkUmVmcmVzaFJlZyQiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQ29vcmRpbmF0b3JBZG1pbkFjY291bnRSZWdpc3Rlci5qc3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IHVzZU5hdmlnYXRlIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSc7XHJcbmltcG9ydCB7IHRvYXN0IH0gZnJvbSAncmVhY3QtdG9hc3RpZnknO1xyXG5pbXBvcnQgQnJlYWRjcnVtYiBmcm9tICcuLi8uLi8uLi9zaGFyZWQvY29tcG9uZW50cy9CcmVhZGNydW1iJztcclxuaW1wb3J0IEZvcm1DYXJkIGZyb20gJy4uLy4uLy4uL3NoYXJlZC9jb21wb25lbnRzL0Zvcm1DYXJkJztcclxuaW1wb3J0IElucHV0RmllbGQgZnJvbSAnLi4vLi4vLi4vc2hhcmVkL2NvbXBvbmVudHMvSW5wdXRGaWVsZCc7XHJcbmltcG9ydCBQcm9maWxlSW1hZ2VVcGxvYWQgZnJvbSAnLi4vLi4vLi4vc2hhcmVkL2NvbXBvbmVudHMvUHJvZmlsZUltYWdlVXBsb2FkJztcclxuaW1wb3J0IEJ1dHRvbiBmcm9tICcuLi8uLi8uLi9zaGFyZWQvY29tcG9uZW50cy9CdXR0b24nO1xyXG5pbXBvcnQgc3R5bGVzIGZyb20gJy4vQ29vcmRpbmF0b3JBZG1pbkFjY291bnRSZWdpc3Rlci5tb2R1bGUuY3NzJztcclxuaW1wb3J0IGZvcm1BY3Rpb25zIGZyb20gJy4uLy4uLy4uL3NoYXJlZC9zdHlsZXMvZm9ybUFjdGlvbnMubW9kdWxlLmNzcyc7XHJcbmltcG9ydCBGb3JtQWN0aW9ucyBmcm9tICcuLi8uLi8uLi9zaGFyZWQvY29tcG9uZW50cy9Gb3JtQWN0aW9ucyc7XHJcbmltcG9ydCB7IGdldEVtcGxveWVlVXNlcnMsIGFkZEVtcGxveWVlVXNlciB9IGZyb20gJy4uLy4uLy4uL3V0aWxpdGllcy9zdG9yYWdlcy9lbXBsb3llZVVzZXJTdG9yYWdlJztcclxuaW1wb3J0IHsgQVBJX0NPTkZJRyB9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9lbnZpcm9ubWVudCc7XHJcblxyXG5jb25zdCBkZXBhcnRtZW50cyA9IFtcclxuICAnSVQgRGVwYXJ0bWVudCcsXHJcbiAgJ0Fzc2V0IERlcGFydG1lbnQnLFxyXG4gICdCdWRnZXQgRGVwYXJ0bWVudCdcclxuXTtcclxuXHJcbmNvbnN0IHJvbGVzID0gW1xyXG4gICdUaWNrZXQgQ29vcmRpbmF0b3InLFxyXG4gICdTeXN0ZW0gQWRtaW4nXHJcbl07XHJcblxyXG5jb25zdCBDb29yZGluYXRvckFkbWluQWNjb3VudFJlZ2lzdGVyID0gKCkgPT4ge1xyXG4gIGNvbnN0IG5hdmlnYXRlID0gdXNlTmF2aWdhdGUoKTtcclxuICBcclxuICBjb25zdCBbZm9ybURhdGEsIHNldEZvcm1EYXRhXSA9IHVzZVN0YXRlKHtcclxuICAgIGxhc3ROYW1lOiAnJyxcclxuICAgIGZpcnN0TmFtZTogJycsXHJcbiAgICBtaWRkbGVOYW1lOiAnJyxcclxuICAgIHN1ZmZpeDogJycsXHJcbiAgICBkZXBhcnRtZW50OiAnJyxcclxuICAgIHJvbGU6ICcnLFxyXG4gICAgZW1haWw6ICcnXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IFtlcnJvcnMsIHNldEVycm9yc10gPSB1c2VTdGF0ZSh7fSk7XHJcbiAgY29uc3QgW3RvdWNoZWQsIHNldFRvdWNoZWRdID0gdXNlU3RhdGUoe30pO1xyXG4gIGNvbnN0IFtpc1N1Ym1pdHRpbmcsIHNldElzU3VibWl0dGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XHJcblxyXG4gIGNvbnN0IHZhbGlkYXRlRmllbGQgPSAoZmllbGQsIHZhbHVlKSA9PiB7XHJcbiAgICBsZXQgZXJyb3IgPSAnJztcclxuICBzd2l0Y2ggKGZpZWxkKSB7XHJcbiAgICAgIGNhc2UgJ2xhc3ROYW1lJzpcclxuICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xyXG4gICAgICAgICAgZXJyb3IgPSAnTGFzdCBOYW1lIGlzIHJlcXVpcmVkJztcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlLnRyaW0oKS5sZW5ndGggPCAyKSB7XHJcbiAgICAgICAgICBlcnJvciA9ICdMYXN0IE5hbWUgbXVzdCBiZSBhdCBsZWFzdCAyIGNoYXJhY3RlcnMnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnZmlyc3ROYW1lJzpcclxuICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkge1xyXG4gICAgICAgICAgZXJyb3IgPSAnRmlyc3QgTmFtZSBpcyByZXF1aXJlZCc7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZS50cmltKCkubGVuZ3RoIDwgMikge1xyXG4gICAgICAgICAgZXJyb3IgPSAnRmlyc3QgTmFtZSBtdXN0IGJlIGF0IGxlYXN0IDIgY2hhcmFjdGVycyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdtaWRkbGVOYW1lJzpcclxuICAgICAgICAvLyBNaWRkbGUgTmFtZSBpcyBvcHRpb25hbCwgbm8gdmFsaWRhdGlvblxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdzdWZmaXgnOlxyXG4gICAgICAgIC8vIFN1ZmZpeCBpcyBvcHRpb25hbCwgbm8gdmFsaWRhdGlvblxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdkZXBhcnRtZW50JzpcclxuICAgICAgICBpZiAoIXZhbHVlKSB7XHJcbiAgICAgICAgICBlcnJvciA9ICdEZXBhcnRtZW50IGlzIHJlcXVpcmVkJztcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ3JvbGUnOlxyXG4gICAgICAgIGlmICghdmFsdWUpIHtcclxuICAgICAgICAgIGVycm9yID0gJ1JvbGUgaXMgcmVxdWlyZWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnZW1haWwnOlxyXG4gICAgICAgIGlmICghdmFsdWUudHJpbSgpKSB7XHJcbiAgICAgICAgICBlcnJvciA9ICdFbWFpbCBpcyByZXF1aXJlZCc7XHJcbiAgICAgICAgfSBlbHNlIGlmICghL15bXlxcc0BdK0BbXlxcc0BdK1xcLlteXFxzQF0rJC8udGVzdCh2YWx1ZSkpIHtcclxuICAgICAgICAgIGVycm9yID0gJ0ludmFsaWQgZW1haWwgZm9ybWF0JztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgZXhpc3RpbmdVc2VycyA9IGdldEVtcGxveWVlVXNlcnMoKTtcclxuICAgICAgICAgIGlmIChleGlzdGluZ1VzZXJzLnNvbWUodXNlciA9PiB1c2VyLmVtYWlsID09PSB2YWx1ZS50cmltKCkpKSB7XHJcbiAgICAgICAgICAgIGVycm9yID0gJ0VtYWlsIGFscmVhZHkgZXhpc3RzJztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZXJyb3I7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgaGFuZGxlSW5wdXRDaGFuZ2UgPSAoZmllbGQpID0+IChlKSA9PiB7XHJcbiAgICBjb25zdCB2YWx1ZSA9IGUudGFyZ2V0LnZhbHVlO1xyXG4gICAgXHJcbiAgICBzZXRGb3JtRGF0YSh7XHJcbiAgICAgIC4uLmZvcm1EYXRhLFxyXG4gICAgICBbZmllbGRdOiB2YWx1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gVmFsaWRhdGUgZmllbGQgaWYgaXQgaGFzIGJlZW4gdG91Y2hlZFxyXG4gICAgaWYgKHRvdWNoZWRbZmllbGRdKSB7XHJcbiAgICAgIGNvbnN0IGVycm9yID0gdmFsaWRhdGVGaWVsZChmaWVsZCwgdmFsdWUpO1xyXG4gICAgICBzZXRFcnJvcnMoe1xyXG4gICAgICAgIC4uLmVycm9ycyxcclxuICAgICAgICBbZmllbGRdOiBlcnJvclxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBbHNvIHZhbGlkYXRlIGNvbmZpcm1QYXNzd29yZCB3aGVuIHBhc3N3b3JkIGNoYW5nZXNcclxuICAgIGlmIChmaWVsZCA9PT0gJ3Bhc3N3b3JkJyAmJiB0b3VjaGVkLmNvbmZpcm1QYXNzd29yZCkge1xyXG4gICAgICBjb25zdCBjb25maXJtRXJyb3IgPSB2YWxpZGF0ZUZpZWxkKCdjb25maXJtUGFzc3dvcmQnLCBmb3JtRGF0YS5jb25maXJtUGFzc3dvcmQpO1xyXG4gICAgICBzZXRFcnJvcnMoe1xyXG4gICAgICAgIC4uLmVycm9ycyxcclxuICAgICAgICBwYXNzd29yZDogdmFsaWRhdGVGaWVsZCgncGFzc3dvcmQnLCB2YWx1ZSksXHJcbiAgICAgICAgY29uZmlybVBhc3N3b3JkOiBjb25maXJtRXJyb3JcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgaGFuZGxlQmx1ciA9IChmaWVsZCkgPT4gKCkgPT4ge1xyXG4gICAgc2V0VG91Y2hlZCh7XHJcbiAgICAgIC4uLnRvdWNoZWQsXHJcbiAgICAgIFtmaWVsZF06IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGVycm9yID0gdmFsaWRhdGVGaWVsZChmaWVsZCwgZm9ybURhdGFbZmllbGRdKTtcclxuICAgIHNldEVycm9ycyh7XHJcbiAgICAgIC4uLmVycm9ycyxcclxuICAgICAgW2ZpZWxkXTogZXJyb3JcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IHZhbGlkYXRlQWxsRmllbGRzID0gKCkgPT4ge1xyXG4gICAgY29uc3QgbmV3RXJyb3JzID0ge307XHJcbiAgICBjb25zdCBuZXdUb3VjaGVkID0ge307XHJcbiAgICBcclxuXHJcblxyXG4gICAgY29uc3QgZmllbGRzVG9WYWxpZGF0ZSA9IFtcclxuICAgICAgJ2xhc3ROYW1lJyxcclxuICAgICAgJ2ZpcnN0TmFtZScsXHJcbiAgICAgICdtaWRkbGVOYW1lJyxcclxuICAgICAgJ3N1ZmZpeCcsXHJcbiAgICAgICdkZXBhcnRtZW50JyxcclxuICAgICAgJ3JvbGUnLFxyXG4gICAgICAnZW1haWwnXHJcbiAgICBdO1xyXG5cclxuICAgIGZpZWxkc1RvVmFsaWRhdGUuZm9yRWFjaChmaWVsZCA9PiB7XHJcbiAgICAgIG5ld1RvdWNoZWRbZmllbGRdID0gdHJ1ZTtcclxuICAgICAgbmV3RXJyb3JzW2ZpZWxkXSA9IHZhbGlkYXRlRmllbGQoZmllbGQsIGZvcm1EYXRhW2ZpZWxkXSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBWYWxpZGF0ZSBwcm9maWxlIGltYWdlIGlmIHByb3ZpZGVkXHJcbiAgICBpZiAoZm9ybURhdGEucHJvZmlsZUltYWdlKSB7XHJcbiAgICAgIG5ld1RvdWNoZWQucHJvZmlsZUltYWdlID0gdHJ1ZTtcclxuICAgICAgbmV3RXJyb3JzLnByb2ZpbGVJbWFnZSA9IHZhbGlkYXRlRmllbGQoJ3Byb2ZpbGVJbWFnZScsIGZvcm1EYXRhLnByb2ZpbGVJbWFnZSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHNldFRvdWNoZWQobmV3VG91Y2hlZCk7XHJcbiAgICBzZXRFcnJvcnMobmV3RXJyb3JzKTtcclxuICAgIFxyXG4gICAgLy8gUmV0dXJuIHRydWUgaWYgbm8gZXJyb3JzXHJcbiAgICByZXR1cm4gIU9iamVjdC52YWx1ZXMobmV3RXJyb3JzKS5zb21lKGVycm9yID0+IGVycm9yICE9PSAnJyk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgaGFuZGxlU3VibWl0ID0gYXN5bmMgKGUpID0+IHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIFxyXG4gICAgaWYgKCF2YWxpZGF0ZUFsbEZpZWxkcygpKSB7XHJcbiAgICAgIHRvYXN0LmVycm9yKCdQbGVhc2UgZml4IHRoZSBlcnJvcnMgaW4gdGhlIGZvcm0gYmVmb3JlIHN1Ym1pdHRpbmcuJyk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHRva2VuID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FkbWluX2FjY2Vzc190b2tlbicpO1xyXG4gICAgICBjb25zdCBwYXlsb2FkID0ge1xyXG4gICAgICAgIGxhc3RfbmFtZTogZm9ybURhdGEubGFzdE5hbWUudHJpbSgpLFxyXG4gICAgICAgIGZpcnN0X25hbWU6IGZvcm1EYXRhLmZpcnN0TmFtZS50cmltKCksXHJcbiAgICAgICAgbWlkZGxlX25hbWU6IGZvcm1EYXRhLm1pZGRsZU5hbWUudHJpbSgpLFxyXG4gICAgICAgIHN1ZmZpeDogZm9ybURhdGEuc3VmZml4LnRyaW0oKSxcclxuICAgICAgICBkZXBhcnRtZW50OiBmb3JtRGF0YS5kZXBhcnRtZW50LFxyXG4gICAgICAgIHJvbGU6IGZvcm1EYXRhLnJvbGUsXHJcbiAgICAgICAgZW1haWw6IGZvcm1EYXRhLmVtYWlsLnRyaW0oKVxyXG4gICAgICB9O1xyXG4gICAgICAvLyBPbmx5IGFkZCBpbWFnZSBpZiBhIGZpbGUgaXMgdXBsb2FkZWQgKG5vdCB1c2VkIGluIGFkbWluIGZvcm0sIGJ1dCBmdXR1cmUtcHJvb2YpXHJcbiAgICAgIC8vIGlmIChmb3JtRGF0YS5wcm9maWxlSW1hZ2UpIHtcclxuICAgICAgLy8gICBwYXlsb2FkLmltYWdlID0gZm9ybURhdGEucHJvZmlsZUltYWdlO1xyXG4gICAgICAvLyB9XHJcbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7QVBJX0NPTkZJRy5CQUNLRU5ELkJBU0VfVVJMfS9hcGkvYWRtaW4vY3JlYXRlLWVtcGxveWVlL2AsIHtcclxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7dG9rZW59YFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcclxuICAgICAgfSk7XHJcbiAgICAgIGlmICghcmVzLm9rKSB7XHJcbiAgICAgICAgY29uc3QgZXJyID0gYXdhaXQgcmVzLmpzb24oKTtcclxuICAgICAgICB0b2FzdC5lcnJvcihlcnIuZXJyb3IgfHwgZXJyLm1lc3NhZ2UgfHwgJ0ZhaWxlZCB0byBjcmVhdGUgdXNlciBhY2NvdW50LicpO1xyXG4gICAgICAgIHNldElzU3VibWl0dGluZyhmYWxzZSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHRvYXN0LnN1Y2Nlc3MoJ1VzZXIgYWNjb3VudCBjcmVhdGVkIGFuZCBhcHByb3ZlZCBzdWNjZXNzZnVsbHkhJyk7XHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gbmF2aWdhdGUoJy9hZG1pbi91c2VyLWFjY2Vzcy9hbGwtdXNlcnMnKSwgMTUwMCk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICB0b2FzdC5lcnJvcignRmFpbGVkIHRvIGNyZWF0ZSB1c2VyIGFjY291bnQuIFBsZWFzZSB0cnkgYWdhaW4uJyk7XHJcbiAgICAgIHNldElzU3VibWl0dGluZyhmYWxzZSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgcmVzZXRGb3JtID0gKCkgPT4ge1xyXG4gICAgc2V0Rm9ybURhdGEoe1xyXG4gICAgICBsYXN0TmFtZTogJycsXHJcbiAgICAgIGZpcnN0TmFtZTogJycsXHJcbiAgICAgIG1pZGRsZU5hbWU6ICcnLFxyXG4gICAgICBzdWZmaXg6ICcnLFxyXG4gICAgICBkZXBhcnRtZW50OiAnJyxcclxuICAgICAgcm9sZTogJycsXHJcbiAgICAgIGVtYWlsOiAnJ1xyXG4gICAgfSk7XHJcbiAgICBzZXRFcnJvcnMoe30pO1xyXG4gICAgc2V0VG91Y2hlZCh7fSk7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxtYWluIGNsYXNzTmFtZT17c3R5bGVzLnJlZ2lzdHJhdGlvbn0+XHJcbiAgICAgIDxCcmVhZGNydW1iXHJcbiAgICAgICAgcm9vdD1cIlVzZXIgTWFuYWdlbWVudFwiXHJcbiAgICAgICAgY3VycmVudFBhZ2U9XCJDcmVhdGUgQWNjb3VudFwiXHJcbiAgICAgICAgcm9vdE5hdmlnYXRlUGFnZT1cIi9hZG1pbi91c2VyLWFjY2Vzcy9hbGwtdXNlcnNcIlxyXG4gICAgICAgIHRpdGxlPVwiQ3JlYXRlIE5ldyBVc2VyIEFjY291bnRcIlxyXG4gICAgICAvPlxyXG4gICAgICA8c2VjdGlvbj5cclxuICAgICAgICA8Rm9ybUNhcmQ+XHJcbiAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3VibWl0fT5cclxuICAgICAgICAgICAgey8qIFBlcnNvbmFsIEluZm9ybWF0aW9uICovfVxyXG4gICAgICAgICAgICA8ZmllbGRzZXQ+XHJcbiAgICAgICAgICAgICAgPGxlZ2VuZCBjbGFzc05hbWU9e3N0eWxlcy5maWVsZHNldExlZ2VuZH0+XHJcbiAgICAgICAgICAgICAgICBQZXJzb25hbCBJbmZvcm1hdGlvblxyXG4gICAgICAgICAgICAgIDwvbGVnZW5kPlxyXG4gICAgICAgICAgICAgIDxJbnB1dEZpZWxkXHJcbiAgICAgICAgICAgICAgICBsYWJlbD1cIkxhc3QgTmFtZVwiXHJcbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkVudGVyIGxhc3QgbmFtZVwiXHJcbiAgICAgICAgICAgICAgICB2YWx1ZT17Zm9ybURhdGEubGFzdE5hbWV9XHJcbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlSW5wdXRDaGFuZ2UoJ2xhc3ROYW1lJyl9XHJcbiAgICAgICAgICAgICAgICBvbkJsdXI9e2hhbmRsZUJsdXIoJ2xhc3ROYW1lJyl9XHJcbiAgICAgICAgICAgICAgICByZXF1aXJlZFxyXG4gICAgICAgICAgICAgICAgZXJyb3I9e2Vycm9ycy5sYXN0TmFtZX1cclxuICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgIDxJbnB1dEZpZWxkXHJcbiAgICAgICAgICAgICAgICBsYWJlbD1cIkZpcnN0IE5hbWVcIlxyXG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJFbnRlciBmaXJzdCBuYW1lXCJcclxuICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtRGF0YS5maXJzdE5hbWV9XHJcbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlSW5wdXRDaGFuZ2UoJ2ZpcnN0TmFtZScpfVxyXG4gICAgICAgICAgICAgICAgb25CbHVyPXtoYW5kbGVCbHVyKCdmaXJzdE5hbWUnKX1cclxuICAgICAgICAgICAgICAgIHJlcXVpcmVkXHJcbiAgICAgICAgICAgICAgICBlcnJvcj17ZXJyb3JzLmZpcnN0TmFtZX1cclxuICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgIDxJbnB1dEZpZWxkXHJcbiAgICAgICAgICAgICAgICBsYWJlbD1cIk1pZGRsZSBOYW1lXCJcclxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiRW50ZXIgbWlkZGxlIG5hbWVcIlxyXG4gICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1EYXRhLm1pZGRsZU5hbWV9XHJcbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlSW5wdXRDaGFuZ2UoJ21pZGRsZU5hbWUnKX1cclxuICAgICAgICAgICAgICAgIG9uQmx1cj17aGFuZGxlQmx1cignbWlkZGxlTmFtZScpfVxyXG4gICAgICAgICAgICAgICAgZXJyb3I9e2Vycm9ycy5taWRkbGVOYW1lfVxyXG4gICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgPElucHV0RmllbGRcclxuICAgICAgICAgICAgICAgIGxhYmVsPVwiU3VmZml4XCJcclxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiZS5nLiwgSnIuLCBTci4sIElJSVwiXHJcbiAgICAgICAgICAgICAgICB2YWx1ZT17Zm9ybURhdGEuc3VmZml4fVxyXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZUlucHV0Q2hhbmdlKCdzdWZmaXgnKX1cclxuICAgICAgICAgICAgICAgIG9uQmx1cj17aGFuZGxlQmx1cignc3VmZml4Jyl9XHJcbiAgICAgICAgICAgICAgICBlcnJvcj17ZXJyb3JzLnN1ZmZpeH1cclxuICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICA8L2ZpZWxkc2V0PlxyXG4gICAgICAgICAgICB7LyogRGVwYXJ0bWVudCAqL31cclxuICAgICAgICAgICAgPGZpZWxkc2V0PlxyXG4gICAgICAgICAgICAgIDxsZWdlbmQgY2xhc3NOYW1lPXtzdHlsZXMuZmllbGRzZXRMZWdlbmR9PlxyXG4gICAgICAgICAgICAgICAgRGVwYXJ0bWVudFxyXG4gICAgICAgICAgICAgIDwvbGVnZW5kPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuZm9ybUdyb3VwfT5cclxuICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9e3N0eWxlcy5mb3JtTGFiZWx9PlxyXG4gICAgICAgICAgICAgICAgICBEZXBhcnRtZW50IDxzcGFuIGNsYXNzTmFtZT17c3R5bGVzLnJlcXVpcmVkfT4qPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgIDxzZWxlY3RcclxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1EYXRhLmRlcGFydG1lbnR9XHJcbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVJbnB1dENoYW5nZSgnZGVwYXJ0bWVudCcpfVxyXG4gICAgICAgICAgICAgICAgICBvbkJsdXI9e2hhbmRsZUJsdXIoJ2RlcGFydG1lbnQnKX1cclxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtlcnJvcnMuZGVwYXJ0bWVudCA/IHN0eWxlcy5pbnB1dEVycm9yIDogJyd9XHJcbiAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj5TZWxlY3QgRGVwYXJ0bWVudDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICB7ZGVwYXJ0bWVudHMubWFwKGRlcHQgPT4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24ga2V5PXtkZXB0fSB2YWx1ZT17ZGVwdH0+e2RlcHR9PC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+XHJcbiAgICAgICAgICAgICAgICB7ZXJyb3JzLmRlcGFydG1lbnQgJiYgKFxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmVycm9yTWVzc2FnZX0+XHJcbiAgICAgICAgICAgICAgICAgICAge2Vycm9ycy5kZXBhcnRtZW50fVxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZmllbGRzZXQ+XHJcbiAgICAgICAgICAgIHsvKiBSb2xlIGFuZCBBY2NvdW50IEluZm9ybWF0aW9uICovfVxyXG4gICAgICAgICAgICA8ZmllbGRzZXQ+XHJcbiAgICAgICAgICAgICAgPGxlZ2VuZCBjbGFzc05hbWU9e3N0eWxlcy5maWVsZHNldExlZ2VuZH0+XHJcbiAgICAgICAgICAgICAgICBSb2xlICYgQWNjb3VudCBJbmZvcm1hdGlvblxyXG4gICAgICAgICAgICAgIDwvbGVnZW5kPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuZm9ybUdyb3VwfT5cclxuICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9e3N0eWxlcy5mb3JtTGFiZWx9PlxyXG4gICAgICAgICAgICAgICAgICBSb2xlIDxzcGFuIGNsYXNzTmFtZT17c3R5bGVzLnJlcXVpcmVkfT4qPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgIDxzZWxlY3RcclxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1EYXRhLnJvbGV9XHJcbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVJbnB1dENoYW5nZSgncm9sZScpfVxyXG4gICAgICAgICAgICAgICAgICBvbkJsdXI9e2hhbmRsZUJsdXIoJ3JvbGUnKX1cclxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtlcnJvcnMucm9sZSA/IHN0eWxlcy5pbnB1dEVycm9yIDogJyd9XHJcbiAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj5TZWxlY3QgUm9sZTwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICB7cm9sZXMubWFwKHJvbGUgPT4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24ga2V5PXtyb2xlfSB2YWx1ZT17cm9sZX0+e3JvbGV9PC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+XHJcbiAgICAgICAgICAgICAgICB7ZXJyb3JzLnJvbGUgJiYgKFxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmVycm9yTWVzc2FnZX0+XHJcbiAgICAgICAgICAgICAgICAgICAge2Vycm9ycy5yb2xlfVxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPElucHV0RmllbGRcclxuICAgICAgICAgICAgICAgIHR5cGU9XCJlbWFpbFwiXHJcbiAgICAgICAgICAgICAgICBsYWJlbD1cIkVtYWlsIEFkZHJlc3NcIlxyXG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJlLmcuLCB1c2VyQGV4YW1wbGUuY29tXCJcclxuICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtRGF0YS5lbWFpbH1cclxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVJbnB1dENoYW5nZSgnZW1haWwnKX1cclxuICAgICAgICAgICAgICAgIG9uQmx1cj17aGFuZGxlQmx1cignZW1haWwnKX1cclxuICAgICAgICAgICAgICAgIHJlcXVpcmVkXHJcbiAgICAgICAgICAgICAgICBlcnJvcj17ZXJyb3JzLmVtYWlsfVxyXG4gICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgIDwvZmllbGRzZXQ+XHJcbiAgICAgICAgICAgIHsvKiBBY3Rpb24gQnV0dG9ucyAqL31cclxuICAgICAgICAgICAgPEZvcm1BY3Rpb25zXHJcbiAgICAgICAgICAgICAgb25DYW5jZWw9eygpID0+IG5hdmlnYXRlKCcvYWRtaW4vdXNlci1hY2Nlc3MvYWxsLXVzZXJzJyl9XHJcbiAgICAgICAgICAgICAgY2FuY2VsTGFiZWw9XCJDYW5jZWxcIlxyXG4gICAgICAgICAgICAgIHN1Ym1pdExhYmVsPXtpc1N1Ym1pdHRpbmcgPyAnQ3JlYXRpbmcuLi4nIDogJ0NyZWF0ZSBBY2NvdW50J31cclxuICAgICAgICAgICAgICBzdWJtaXREaXNhYmxlZD17aXNTdWJtaXR0aW5nfVxyXG4gICAgICAgICAgICAgIHN1Ym1pdFZhcmlhbnQ9XCJwcmltYXJ5XCJcclxuICAgICAgICAgICAgLz5cclxuICAgICAgICAgIDwvZm9ybT5cclxuICAgICAgICA8L0Zvcm1DYXJkPlxyXG4gICAgICA8L3NlY3Rpb24+XHJcbiAgICA8L21haW4+XHJcbiAgKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IENvb3JkaW5hdG9yQWRtaW5BY2NvdW50UmVnaXN0ZXI7XHJcbiJdLCJmaWxlIjoiQzovVXNlcnMvTmFkaW5lIFNhbiBKdWFuL0Rlc2t0b3AvQ2Fwc3RvbmUgMi9Hcm91cDVDYXBzdG9uZTEvZnJvbnRlbmRmb2xkZXIvc3JjL2Nvb3JkaW5hdG9yLWFkbWluL3BhZ2VzL2FjY291bnQtcmVnaXN0ZXIvQ29vcmRpbmF0b3JBZG1pbkFjY291bnRSZWdpc3Rlci5qc3gifQ==