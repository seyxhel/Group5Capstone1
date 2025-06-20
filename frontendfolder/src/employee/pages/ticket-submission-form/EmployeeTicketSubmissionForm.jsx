import { useForm } from 'react-hook-form';
import { useState } from 'react';
import styles from './EmployeeTicketSubmissionForm.module.css';
import { categories, subCategories } from '../../../utilities/ticket-data/ticketStaticData';

export default function EmployeeTicketSubmissionForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const selectedCategory = watch('category');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState('');

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

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFileError('');

    const validNewFiles = newFiles.filter(file =>
      ALLOWED_FILE_TYPES.includes(file.type)
    );

    if (newFiles.length !== validNewFiles.length) {
      setFileError('Only PNG, JPG, PDF, Word, Excel, and CSV files are allowed.');
    }

    const updatedFiles = [...selectedFiles, ...validNewFiles];
    setSelectedFiles(updatedFiles);
    setValue('fileUpload', updatedFiles);

    e.target.value = '';
  };

  const removeFile = (index) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setValue('fileUpload', updatedFiles.length > 0 ? updatedFiles : null);
  };

  const onSubmit = async (data) => {
    console.log('Ticket Submitted:', data);
  };

  return (
    <main className={styles.registration}>
      <section className={styles.registrationForm}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Subject */}
          <fieldset>
            <label htmlFor="subject">
              Subject<span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="subject"
              placeholder="Enter ticket subject"
              {...register('subject', { required: 'Subject is required' })}
            />
            {errors.subject && (
              <span className={styles.errorMessage}>{errors.subject.message}</span>
            )}
          </fieldset>

          {/* Category */}
          <fieldset>
            <label htmlFor="category">
              Category<span className={styles.required}>*</span>
            </label>
            <select
              id="category"
              {...register('category', { required: 'Category is required' })}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <span className={styles.errorMessage}>{errors.category.message}</span>
            )}
          </fieldset>

          {/* Sub-Category */}
          <fieldset>
            <label htmlFor="subCategory">
              Sub-Category<span className={styles.required}>*</span>
            </label>
            <select
              id="subCategory"
              disabled={!selectedCategory}
              {...register('subCategory', { required: 'Sub-Category is required' })}
            >
              <option value="">Select Sub-Category</option>
              {selectedCategory &&
                subCategories[selectedCategory]?.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
            </select>
            {errors.subCategory && (
              <span className={styles.errorMessage}>{errors.subCategory.message}</span>
            )}
          </fieldset>

          {/* Description */}
          <fieldset>
            <label htmlFor="description">
              Description<span className={styles.required}>*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              placeholder="Provide a detailed description..."
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && (
              <span className={styles.errorMessage}>{errors.description.message}</span>
            )}
          </fieldset>

          {/* File Upload */}
          <fieldset>
            <label htmlFor="fileUpload">File Upload (PNG, JPG, PDF, Word, Excel, CSV)</label>
            <div className={styles.fileUploadWrapper}>
              <input
                type="file"
                id="fileUpload"
                multiple
                accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                {...register('fileUpload')}
                onChange={handleFileChange}
                hidden
              />
              <label htmlFor="fileUpload" className={styles.uploadFileBtn}>
                {selectedFiles.length > 0 ? 'Add More Files' : 'Choose Files'}
              </label>

              {fileError && (
                <span className={styles.errorMessage}>{fileError}</span>
              )}

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

          {/* Schedule Request */}
          <fieldset>
            <label htmlFor="schedule">Schedule Request</label>
            <input
              type="datetime-local"
              id="schedule"
              {...register('schedule')}
            />
          </fieldset>

          <button type="submit" className={styles.submitBtn}>
            Submit Ticket
          </button>
        </form>
      </section>
    </main>
  );
}
