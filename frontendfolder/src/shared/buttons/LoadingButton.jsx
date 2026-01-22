import "./LoadingButton.css";
import React from 'react';
import Button from '../components/Button';

export default function LoadingButton({ loading = false, children, onClick, variant = 'primary', disabled = false, ...props }) {
  return (
    <Button onClick={onClick} variant={variant} disabled={disabled || loading} {...props}>
      {loading && <span className="loading-button" aria-hidden="true" />}
      {children}
    </Button>
  );
}
