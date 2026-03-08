import React from 'react';

interface SettingInputProps {
  label: string;
  description?: string;
  value: string | number;
  type?: 'text' | 'number' | 'range' | 'password';
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SettingInput: React.FC<SettingInputProps> = ({
  label,
  description,
  value,
  type = 'text',
  min,
  max,
  step,
  placeholder,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="setting-input">
      <label className="setting-input-label">
        <span className="setting-input-title">{label}</span>
        {description && (
          <span className="setting-input-description">{description}</span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="setting-input-field"
      />
    </div>
  );
};
