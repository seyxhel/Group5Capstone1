import React from 'react';
import styles from './InputField.module.css';

const InputField = ({ 
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  required = false,
  disabled = false,
  error = '',
  style = {},
  inputStyle = {},
  // Accept container class and input-specific class names
  className = '',
  inputClassName = '',
  // Currency variant support
  variant = 'default', // 'default' or 'currency'
  ...props
}) => {
  // Avoid passing className/inputClassName through to the input via {...props}
  const otherProps = { ...props };
  delete otherProps.className;
  delete otherProps.inputClassName;
  delete otherProps.variant;

  // Format currency with commas (display only)
  const formatWithCommas = (val) => {
    if (!val) return '';
    
    // Remove all non-digit and non-decimal characters
    let cleaned = String(val).replace(/[^\d.]/g, '');
    
    // Handle multiple decimals - keep only first one
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Split into integer and decimal
    const [intPart, decPart] = cleaned.split('.');
    
    // Format integer part with commas
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Return with decimal if exists
    return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
  };

  // Handle natural currency input - let users type however they want
  const handleCurrencyChange = (e) => {
    let inputValue = e.target.value;
    
    // Remove all non-digit and non-decimal characters
    let cleaned = inputValue.replace(/[^\d.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    onChange?.({ target: { value: cleaned } });
  };
  
  // Standardize to 2 decimal places on blur
  const handleCurrencyBlur = (e) => {
    let rawValue = e.target.value.replace(/[^\d.]/g, '');
    
    if (!rawValue || rawValue === '0' || rawValue === '0.00') {
      onChange?.({ target: { value: '0.00' } });
    } else {
      // Parse and format to 2 decimal places
      const numValue = parseFloat(rawValue);
      if (!isNaN(numValue)) {
        const formatted = numValue.toFixed(2);
        onChange?.({ target: { value: formatted } });
      }
    }
    
    onBlur?.(e);
  };

  // Currency variant render
  if (variant === 'currency') {
    return (
      <div className={`${styles.inputFieldContainer} ${className || ''}`} style={style}>
        {label && (
          <label className={styles.label}>
            {label}
            {required && <span className={styles.required}> *</span>}
          </label>
        )}
        <div className={styles.currencyFieldWrapper}>
          <span className={styles.currencyLabel}>PHP</span>
          <input
            type="text"
            inputMode="decimal"
            className={`${styles.currencyInput} ${inputClassName || ''} ${error ? styles.inputError : ''} ${disabled ? styles.inputDisabled : ''}`}
            placeholder={placeholder || '0.00'}
            value={formatWithCommas(value)}
            onChange={handleCurrencyChange}
            onBlur={handleCurrencyBlur}
            onFocus={onFocus}
            disabled={disabled}
            autoComplete="off"
            style={inputStyle}
            {...otherProps}
          />
        </div>
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // Textarea variant render
  if (type === 'textarea') {
    return (
      <div className={`${styles.inputFieldContainer} ${className || ''}`} style={style}>
        {label && (
          <label className={styles.label}>
            {label}
            {required && <span className={styles.required}> *</span>}
          </label>
        )}
        <textarea
          className={`${styles.input} ${inputClassName || ''} ${error ? styles.inputError : ''} ${disabled ? styles.inputDisabled : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          rows={4}
          style={inputStyle}
          {...otherProps}
        />
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // Long textarea variant render
  if (variant === 'longTextArea') {
    return (
      <div className={`${styles.inputFieldContainer} ${className || ''}`} style={style}>
        {label && (
          <label className={styles.label}>
            {label}
            {required && <span className={styles.required}> *</span>}
          </label>
        )}
        <textarea
          className={`${styles.input} ${inputClassName || ''} ${error ? styles.inputError : ''} ${disabled ? styles.inputDisabled : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          rows={7}
          style={inputStyle}
          {...otherProps}
        />
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // Default variant render
  return (
    <div className={`${styles.inputFieldContainer} ${className || ''}`} style={style}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <input
        type={type}
        className={`${styles.input} ${inputClassName || ''} ${error ? styles.inputError : ''} ${disabled ? styles.inputDisabled : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled}
        style={inputStyle}
        {...otherProps}
      />
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
};

export default InputField;
