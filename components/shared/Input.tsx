// components/shared/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  warning?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  inputContainerClassName?: string; // For wrapper around input and potential icons
}

export const Input: React.FC<InputProps> = ({
  label,
  id,
  error,
  warning,
  type = 'text',
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  inputContainerClassName = '',
  ...props
}) => {
  const baseInputClass = `form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#1b0e0e] border-none bg-[#f3e7e8] h-12 md:h-14 placeholder:text-[#994d51] p-3 md:p-4 text-base font-normal leading-normal focus:ring-2 focus:ring-[#ea2832]/50 focus:outline-none read-only:bg-gray-200 read-only:cursor-not-allowed disabled:bg-gray-200 disabled:cursor-not-allowed`;

  const errorClass = 'ring-1 ring-red-500 focus:ring-red-500';
  const warningClass = 'ring-1 ring-amber-500 focus:ring-amber-500';

  const validationClass = error ? errorClass : warning ? warningClass : '';

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className={`block text-base font-medium text-[#1b0e0e] pb-2 ${labelClassName}`}>
          {label}
        </label>
      )}
      <div className={`relative ${inputContainerClassName}`}>
        <input
          type={type}
          id={id}
          className={`${baseInputClass} ${validationClass} ${inputClassName}`}
          aria-invalid={!!error}
          aria-describedby={error && id ? `${id}-error` : warning && id ? `${id}-warning` : undefined}
          {...props}
        />
      </div>
      {error && id && <p id={`${id}-error`} className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && warning && id && <p id={`${id}-warning`} className="mt-1 text-xs text-amber-700">{warning}</p>}
    </div>
  );
};
