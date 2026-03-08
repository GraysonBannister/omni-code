import React from 'react';

interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="setting-toggle">
      <label className="setting-toggle-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="setting-toggle-input"
        />
        <span className="setting-toggle-slider"></span>
        <div className="setting-toggle-content">
          <span className="setting-toggle-title">{label}</span>
          {description && (
            <span className="setting-toggle-description">{description}</span>
          )}
        </div>
      </label>
    </div>
  );
};
