'use client';

import PhoneInputWithCountry from 'react-phone-number-input';
import type { Country } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string | undefined) => void;
  defaultCountry?: Country;
  label?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = 'CA',
  label,
  error,
  placeholder = '+1 234 567 8900',
  disabled = false,
  className = '',
}: PhoneInputProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text">
          {label}
        </label>
      )}
      <div
        className={`
          phone-input-wrapper
          ${error ? 'phone-input-error' : ''}
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <PhoneInputWithCountry
          international
          countryCallingCodeEditable={false}
          defaultCountry={defaultCountry}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="phone-input-field"
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}

        <style jsx global>{`
          .phone-input-wrapper {
            position: relative;
          }

          .phone-input-wrapper .PhoneInput {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .phone-input-wrapper .PhoneInputCountry {
            display: flex;
            align-items: center;
            padding: 12px;
            background: var(--color-surface-hover);
            border: 1px solid var(--color-border);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .phone-input-wrapper .PhoneInputCountry:hover {
            background: var(--color-border);
          }

          .phone-input-wrapper .PhoneInputCountryIcon {
            width: 24px;
            height: 18px;
            border-radius: 2px;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }

          .phone-input-wrapper .PhoneInputCountryIcon--border {
            background-color: transparent;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          }

          .phone-input-wrapper .PhoneInputCountrySelectArrow {
            margin-left: 8px;
            width: 8px;
            height: 8px;
            border-style: solid;
            border-color: var(--color-text-muted);
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
            opacity: 0.7;
          }

          .phone-input-wrapper .PhoneInputInput {
            flex: 1;
            padding: 12px 16px;
            font-size: 16px;
            border: 1px solid var(--color-border);
            border-radius: 12px;
            background: var(--color-surface);
            color: var(--color-text);
            outline: none;
            transition: all 0.2s;
          }

          .phone-input-wrapper .PhoneInputInput:focus {
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px var(--color-primary-ring);
          }

          .phone-input-wrapper .PhoneInputInput::placeholder {
            color: var(--color-text-muted);
          }

          .phone-input-error .PhoneInputInput {
            border-color: var(--color-error);
          }

          .phone-input-error .PhoneInputInput:focus {
            border-color: var(--color-error);
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
          }

          /* Country select dropdown */
          .phone-input-wrapper .PhoneInputCountrySelect {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            z-index: 1;
            border: 0;
            opacity: 0;
            cursor: pointer;
          }

          .phone-input-wrapper .PhoneInputCountrySelect option {
            padding: 8px;
            background: var(--color-surface);
            color: var(--color-text);
          }
        `}</style>
    </div>
  );
}
