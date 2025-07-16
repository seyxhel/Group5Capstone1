import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingButton from '../../../shared/buttons/LoadingButton';
import styles from './EmployeeTicketSubmissionForm.module.css';
import { categories, subCategories } from '../../../utilities/ticket-data/ticketStaticData';

const ALLOWED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const namePattern = /^[a-zA-Z.\-'\s]+$/;
const letterPresencePattern = /[a-zA-Z]/;

export default function EmployeeTicketSubmissionForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const navigate = useNavigate();
  const selectedCategory = watch('category');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjectLengthError, setSubjectLengthError] = useState("");

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const validFiles = newFiles.filter(file => ALLOWED_FILE_TYPES.includes(file.type));
    setFileError(validFiles.length !== newFiles.length
      ? 'Only PNG, JPG, PDF, Word, Excel, and CSV files are allowed.'
      : ''
    );

    const updated = [...selectedFiles, ...validFiles];
    setSelectedFiles(updated);
    setValue('fileUpload', updated);
    e.target.value = '';
  };

  const removeFile = (index) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    setValue('fileUpload', updated.length > 0 ? updated : null);
  };

  const refreshAccessToken = async () => {
    const refresh = localStorage.getItem("employee_refresh_token");
    if (!refresh) throw new Error("Session expired. Please log in again.");
    const res = await fetch(`${API_URL}token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) throw new Error("Session expired. Please log in again.");
    const data = await res.json();
    localStorage.setItem("employee_access_token", data.access);
    return data.access;
  };

  const onSubmit = async (data) => {
    setSubjectLengthError("");
    if (data.subject && data.subject.length > 70) {
      setSubjectLengthError("Subject should be 70 characters or less.");
      return;
    }
    setIsSubmitting(true);

    const requiredFields = ['subject', 'category', 'subCategory', 'description'];
    const isEmpty = requiredFields.some(field => !data[field]);

    if (isEmpty) {
      toast.error('Please fill out all required fields.');
      setIsSubmitting(false);
      return;
    }

    const submitTicket = async (accessToken) => {
      const formData = new FormData();
      formData.append("subject", data.subject);
      formData.append("category", data.category);
      formData.append("sub_category", data.subCategory);
      formData.append("description", data.description);
      if (data.schedule) formData.append("scheduled_date", data.schedule);
      (selectedFiles || []).forEach(file => {
        formData.append("files[]", file);
      });

      const res = await fetch(`${API_URL}tickets/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      return res;
    };

    try {
      let token = localStorage.getItem("employee_access_token");
      let res = await submitTicket(token);

      // If token expired, try to refresh and retry once
      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await submitTicket(token);
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to submit ticket.");
      }

      const ticket = await res.json();
      toast.success('Ticket successfully submitted.');
      setTimeout(() => navigate(`/employee/ticket-tracker/${ticket.ticket_number || ticket.id}`), 1500);
    } catch (err) {
      toast.error(err.message || 'Failed to submit a ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.registration}>
      <section className={styles.registrationForm}>
        <form onSubmit={handleSubmit(onSubmit)} autoComplete='off'>
          <FormField
            id="subject"
            label="Subject"
            required
            autoComplete="off"
            error={errors.subject || (subjectLengthError ? { message: subjectLengthError } : undefined)}
            render={() => (
              <input
                type="text"
                placeholder="Enter ticket subject"
                maxLength={70}
                {...register('subject', {
                  required: 'Subject is required.',
                  validate: value => {
                    if (!value.trim()) return 'Subject is required.';
                    if (!/[a-zA-Z]/.test(value)) return 'Subject must contain at least one letter.';
                    if (/([\p{Emoji_Presentation}\p{Extended_Pictographic}])/u.test(value)) return 'Invalid character.';
                    return true;
                  },
                })}
                onInput={e => {
                  // Trigger validation on every input
                  e.target.form && e.target.form.dispatchEvent(new Event('submit', { cancelable: true }));
                }}
              />
            )}
          />

          <FormField
            id="category"
            label="Category"
            required
            error={errors.category}
            render={() => (
              <select {...register('category', { required: 'Category is required.' })}>
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          />

          <FormField
            id="subCategory"
            label="Sub-Category"
            required
            error={errors.subCategory}
            render={() => (
              <select
                disabled={!selectedCategory}
                {...register('subCategory', { required: 'Sub-Category is required.' })}
              >
                <option value="">Select Sub-Category</option>
                {selectedCategory &&
                  subCategories[selectedCategory]?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
              </select>
            )}
          />

          <FormField
            id="description"
            label="Description"
            required
            error={errors.description}
            render={() => (
              <textarea
                rows={5}
                placeholder="Provide a detailed description..."
                maxLength={500}
                {...register('description', {
                  required: 'Description is required.',
                  validate: value => {
                    if (!value.trim()) return 'Description is required.';
                    if (!/[a-zA-Z]/.test(value)) return 'Description must contain at least one letter.';
                    if (/([\p{Emoji_Presentation}\p{Extended_Pictographic}])/u.test(value)) return 'Invalid character.';
                    if (value.length > 500) return 'Description must not exceed 500 characters.';
                    return true;
                  },
                })}
                onInput={e => {
                  // Trigger validation on every input
                  e.target.form && e.target.form.dispatchEvent(new Event('submit', { cancelable: true }));
                }}
              />
            )}
          />

          {/* File Upload */}
          <fieldset>
            <label htmlFor="fileUpload">File Upload (PNG, JPG, PDF, Word, Excel, & CSV)</label>
            <div className={styles.fileUploadWrapper}>
              <input
                type="file"
                id="fileUpload"
                multiple
                accept={ALLOWED_FILE_TYPES.join(',')}
                {...register('fileUpload')}
                onChange={handleFileChange}
                hidden
              />
              <label htmlFor="fileUpload" className={styles.uploadFileBtn}>
                {selectedFiles.length > 0 ? 'Add More Files' : 'Choose Files'}
              </label>
              {fileError && <span className={styles.errorMessage}>{fileError}</span>}

              {selectedFiles.length > 0 && (
                <div className={styles.filePreviewList}>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className={styles.filePreview}>
                      <p className={styles.fileName}>{file.name}</p>
                      <button
                        type="button"
                        className={styles.removeFileBtn}
                        onClick={() => removeFile(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          <FormField
            id="schedule"
            label="Schedule Request"
            render={() => {
              const today = new Date();
              const localDate = today.getFullYear() + '-' +
                String(today.getMonth() + 1).padStart(2, '0') + '-' +
                String(today.getDate()).padStart(2, '0');
              return (
                <input
                  type="date"
                  min={localDate}
                  {...register('schedule')}
                />
              );
            }}
          />

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting && <LoadingButton />}
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </section>
    </main>
  );
}

function FormField({ id, label, required = false, error, render }) {
  return (
    <fieldset>
      <label htmlFor={id}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {render()}
      {error && <span className={styles.errorMessage}>{error.message}</span>}
    </fieldset>
  );
}
