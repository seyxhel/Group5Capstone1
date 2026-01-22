import React from 'react';
import Button from './Button';
import styles from '../styles/formActions.module.css';

/**
 * FormActions
 * Props:
 * - onCancel: function to call when cancel clicked
 * - cancelLabel: label for cancel button (default: 'Cancel')
 * - onSubmit: submit handler (form should still handle onSubmit)
 * - submitLabel: label for submit button
 * - submitDisabled: boolean
 * - submitVariant: 'primary'|'secondary' (default: 'primary')
 */
export default function FormActions({
  onCancel,
  cancelLabel = 'Cancel',
  cancelVariant = 'outline',
  submitLabel = 'Submit',
  submitDisabled = false,
  submitVariant = 'primary',
  onSubmit,
  cancelSize,
  submitSize
}) {
  return (
    <div className={styles.actionContainer}>
      <div className={styles.actionFlexChild}>
        <Button
          type="button"
          variant={typeof cancelVariant !== 'undefined' ? cancelVariant : 'outline'}
          size={cancelSize}
          className={styles.formAction}
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      </div>

      <div className={styles.actionFlexChild}>
        <Button
          type={onSubmit ? 'button' : 'submit'}
          variant={submitVariant}
          size={submitSize}
          className={styles.formAction}
          disabled={submitDisabled}
          onClick={onSubmit}
        >
          {submitDisabled ? 'Please complete the form' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
