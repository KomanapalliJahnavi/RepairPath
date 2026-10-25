import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixText?: string;
  suffixText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefixText, suffixText, id, required, className = '', ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#252923] flex items-center justify-between">
            <span>
              {label}
              {required && <span className="text-[#B91C1C] ml-1" aria-hidden="true">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center rounded-md bg-white border border-[#DADBD3] transition-colors focus-within:border-[#285B45] focus-within:ring-1 focus-within:ring-[#285B45] overflow-hidden">
          {prefixText && (
            <span className="px-3 py-2 text-xs font-medium text-[#73766F] bg-[#F5F4EF] border-r border-[#DADBD3] select-none">
              {prefixText}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={!!error}
            aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
            className={`w-full px-3 py-2 text-sm text-[#252923] placeholder-[#8F928B] bg-transparent outline-none disabled:bg-[#F5F4EF] disabled:cursor-not-allowed ${className}`}
            {...props}
          />

          {suffixText && (
            <span className="px-3 py-2 text-xs font-medium text-[#73766F] bg-[#F5F4EF] border-l border-[#DADBD3] select-none">
              {suffixText}
            </span>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-[11px] text-[#73766F] leading-tight">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-xs text-[#B91C1C] font-medium flex items-center gap-1" role="alert">
            <span aria-hidden="true">•</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
