import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, id, required, className = '', ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[#252923] flex items-center justify-between">
            <span>
              {label}
              {required && <span className="text-[#B91C1C] ml-1" aria-hidden="true">*</span>}
            </span>
          </label>
        )}

        <div className="relative rounded-md bg-white border border-[#DADBD3] transition-colors focus-within:border-[#285B45] focus-within:ring-1 focus-within:ring-[#285B45]">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-invalid={!!error}
            aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
            className={`w-full px-3 py-2 pr-8 text-sm text-[#252923] bg-transparent outline-none appearance-none cursor-pointer disabled:bg-[#F5F4EF] disabled:cursor-not-allowed ${className}`}
            {...props}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#73766F]">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
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

Select.displayName = 'Select';
