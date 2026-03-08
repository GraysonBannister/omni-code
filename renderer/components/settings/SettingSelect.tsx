import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface SettingSelectProps {
  label: string;
  description?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SettingSelect: React.FC<SettingSelectProps> = ({
  label,
  description,
  value,
  options,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="setting-select">
      <label className="setting-select-label">
        <span className="setting-select-title">{label}</span>
        {description && (
          <span className="setting-select-description">{description}</span>
        )}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="setting-select-input"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
