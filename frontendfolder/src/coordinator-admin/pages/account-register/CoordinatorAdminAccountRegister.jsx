import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import FormCard from '../../../shared/components/FormCard';
import InputField from '../../../shared/components/InputField';
import ProfileImageUpload from '../../../shared/components/ProfileImageUpload';
import Button from '../../../shared/components/Button';
import styles from './CoordinatorAdminAccountRegister.module.css';
import formActions from '../../../shared/styles/formActions.module.css';
import FormActions from '../../../shared/components/FormActions';
import { getEmployeeUsers, addEmployeeUser } from '../../../utilities/storages/employeeUserStorage';
import { API_CONFIG } from '../../../config/environment';

const departments = [
  'IT Department',
  'Asset Department',
  'Budget Department'
];

const roles = [
  'Ticket Coordinator',
  'System Admin'
];

const CoordinatorAdminAccountRegister = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    suffix: '',
    department: '',
    role: '',
    email: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field, value) => {
    let error = '';
  switch (field) {
      case 'lastName':
        if (!value.trim()) {
          error = 'Last Name is required';
        } else if (value.trim().length < 2) {
          error = 'Last Name must be at least 2 characters';
        }
        break;
      case 'firstName':
        if (!value.trim()) {
          error = 'First Name is required';
        } else if (value.trim().length < 2) {
          error = 'First Name must be at least 2 characters';
        }
        break;
      case 'middleName':
        // Middle Name is optional, no validation
        break;
      case 'suffix':
        // Suffix is optional, no validation
        break;
      case 'department':
        if (!value) {
          error = 'Department is required';
        }
        break;
      case 'role':
        if (!value) {
          error = 'Role is required';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Invalid email format';
        } else {
          const existingUsers = getEmployeeUsers();
          if (existingUsers.some(user => user.email === value.trim())) {
            error = 'Email already exists';
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

    // Validate field if it has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({
        ...errors,
        [field]: error
      });
    }

    // Also validate confirmPassword when password changes
    if (field === 'password' && touched.confirmPassword) {
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      setErrors({
        ...errors,
        password: validateField('password', value),
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
      'lastName',
      'firstName',
      'middleName',
      'suffix',
      'department',
      'role',
      'email'
    ];

    fieldsToValidate.forEach(field => {
      newTouched[field] = true;
      newErrors[field] = validateField(field, formData[field]);
    });

    // Validate profile image if provided
    if (formData.profileImage) {
      newTouched.profileImage = true;
      newErrors.profileImage = validateField('profileImage', formData.profileImage);
    }
    
    setTouched(newTouched);
    setErrors(newErrors);
    
    // Return true if no errors
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAllFields()) {
      toast.error('Please fix the errors in the form before submitting.');
      return;
    }
    try {
  // Some login flows store tokens under 'access_token' (generic) while
  // dev utilities or older code may use 'admin_access_token'. Prefer
  // admin-specific key but fall back to generic 'access_token'.
  const token = localStorage.getItem('admin_access_token') || localStorage.getItem('access_token'); 
      const payload = {
        last_name: formData.lastName.trim(),
        first_name: formData.firstName.trim(),
        middle_name: formData.middleName.trim(),
        suffix: formData.suffix.trim(),
        department: formData.department,
        role: formData.role,
        email: formData.email.trim()
      };
      // Only add image if a file is uploaded (not used in admin form, but future-proof)
      // if (formData.profileImage) {
      //   payload.image = formData.profileImage;
      // }
  const res = await fetch(`${API_CONFIG.BACKEND.BASE_URL}/api/admin/create-employee/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || err.message || 'Failed to create user account.');
        setIsSubmitting(false);
        return;
      }
      toast.success('User account created and approved successfully!');
      setTimeout(() => navigate('/admin/user-access/all-users'), 1500);
    } catch (error) {
      toast.error('Failed to create user account. Please try again.');
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      lastName: '',
      firstName: '',
      middleName: '',
      suffix: '',
      department: '',
      role: '',
      email: ''
    });
    setErrors({});
    setTouched({});
  };

  return (
    <main className={styles.registration}>
      <Breadcrumb
        root="User Management"
        currentPage="Create Account"
        rootNavigatePage="/admin/user-access/all-users"
        title="Create New User Account"
      />
      <section>
        <FormCard>
          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <fieldset>
              <legend className={styles.fieldsetLegend}>
                Personal Information
              </legend>
              <InputField
                label="Last Name"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                onBlur={handleBlur('lastName')}
                required
                error={errors.lastName}
              />
              <InputField
                label="First Name"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                onBlur={handleBlur('firstName')}
                required
                error={errors.firstName}
              />
              <InputField
                label="Middle Name"
                placeholder="Enter middle name"
                value={formData.middleName}
                onChange={handleInputChange('middleName')}
                onBlur={handleBlur('middleName')}
                error={errors.middleName}
              />
              <InputField
                label="Suffix"
                placeholder="e.g., Jr., Sr., III"
                value={formData.suffix}
                onChange={handleInputChange('suffix')}
                onBlur={handleBlur('suffix')}
                error={errors.suffix}
              />
            </fieldset>
            {/* Department */}
            <fieldset>
              <legend className={styles.fieldsetLegend}>
                Department
              </legend>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Department <span className={styles.required}>*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={handleInputChange('department')}
                  onBlur={handleBlur('department')}
                  className={errors.department ? styles.inputError : ''}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <div className={styles.errorMessage}>
                    {errors.department}
                  </div>
                )}
              </div>
            </fieldset>
            {/* Role and Account Information */}
            <fieldset>
              <legend className={styles.fieldsetLegend}>
                Role & Account Information
              </legend>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Role <span className={styles.required}>*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={handleInputChange('role')}
                  onBlur={handleBlur('role')}
                  className={errors.role ? styles.inputError : ''}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.role && (
                  <div className={styles.errorMessage}>
                    {errors.role}
                  </div>
                )}
              </div>
              <InputField
                type="email"
                label="Email Address"
                placeholder="e.g., user@example.com"
                value={formData.email}
                onChange={handleInputChange('email')}
                onBlur={handleBlur('email')}
                required
                error={errors.email}
              />
            </fieldset>
            {/* Action Buttons */}
            <FormActions
              onCancel={() => navigate('/admin/user-access/all-users')}
              cancelLabel="Cancel"
              submitLabel={isSubmitting ? 'Creating...' : 'Create Account'}
              submitDisabled={isSubmitting}
              submitVariant="primary"
            />
          </form>
        </FormCard>
      </section>
    </main>
  );
};

export default CoordinatorAdminAccountRegister;
