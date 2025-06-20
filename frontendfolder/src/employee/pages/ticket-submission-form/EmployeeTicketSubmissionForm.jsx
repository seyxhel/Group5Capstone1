import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './EmployeeTicketSubmissionForm.module.css';
import { categories, subCategories } from '../../../utilities/ticket-data/ticketStaticData';

export default function EmployeeTicketSubmissionForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const selectedCategory = watch('category');

  const onSubmit = async (data) => {
    try {
      if (Object.keys(errors).length > 0) {
        toast.error('Please fill out the fields correctly.');
        return;
      }

      // Simulate ticket submission
      console.log('Ticket Submitted:', data);
      toast.success('Ticket successfully submitted.');

      setTimeout(() => {
        navigate('/employee/active-tickets?filter=submitted');
      }, 3000);
    } catch (err) {
      toast.error('Failed to submit a ticket. Please try again.');
    }
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
