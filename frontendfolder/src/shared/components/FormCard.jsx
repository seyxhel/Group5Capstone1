import React from 'react';
import styles from './FormCard.module.css';
import InputField from './InputField';
import SelectField from './SelectField';

export default function FormCard({ children, className = '', ...rest }) {
  // Always include the shared formContainer so changes there affect all forms
  const classes = `${styles.card} ${styles.formContainer} ${className}`.trim();
  return (
    <div className={classes} {...rest}>
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
}

export { InputField, SelectField };
