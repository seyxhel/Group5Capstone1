import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingButton from '../../../shared/buttons/LoadingButton';
import styles from './EmployeeTicketSubmissionForm.module.css';
import { categories, subCategories } from '../../../utilities/ticket-data/ticketStaticData';
import { addNewEmployeeTicket } from '../../../utilities/storages/employeeTicketStorageBonjing';

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

const mockEmployee = {
  userId: 'U001',
  role: 'User',
  name: 'Bonjing San Jose',
  department: 'IT Department',
};

export default function EmployeeTicketSubmissionForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const selectedCategory = watch('category');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const requiredFields = ['subject', 'category', 'subCategory', 'description'];
    const isEmpty = requiredFields.some(field => !data[field]);

    if (isEmpty) {
      toast.error('Please fill out all required fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const newTicket = addNewEmployeeTicket({
        subject: data.subject,
        category: data.category,
        subCategory: data.subCategory,
        description: data.description,
        createdBy: mockEmployee,
        fileUploaded: data.fileUpload || null,
        scheduledRequest: data.schedule || null,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Ticket successfully submitted.');
      setTimeout(() => navigate(`/employee/ticket-tracker/${newTicket.ticketNumber}`), 1500);
    } catch {
      toast.error('Failed to submit a ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.registration}>
      <section className={styles.registrationForm}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            id="subject"
            label="Subject"
            required
            error={errors.subject}
            render={() => (
              <input
                type="text"
                placeholder="Enter ticket subject"
                {...register('subject', { required: 'Subject is required' })}
              />
            )}
          />

          <FormField
            id="category"
            label="Category"
            required
            error={errors.category}
            render={() => (
              <select {...register('category', { required: 'Category is required' })}>
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
                {...register('subCategory', { required: 'Sub-Category is required' })}
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
                {...register('description', { required: 'Description is required' })}
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
            render={() => <input type="date" {...register('schedule')} />}
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
