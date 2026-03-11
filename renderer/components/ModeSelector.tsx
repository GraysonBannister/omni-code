import React from 'react'
import { Code, Building2, Eye, Shield, Bug } from 'lucide-react'
import './ModeSelector.css'

export type AIMode = 'code' | 'architect' | 'review' | 'security' | 'debug'

interface AIModeConfig {
  value: AIMode
  label: string
  description: string
  icon: React.ReactNode
}

const modes: AIModeConfig[] = [
  {
    value: 'code',
    label: 'Code',
    description: 'General coding assistance',
    icon: <Code className="w-4 h-4" />,
  },
  {
    value: 'architect',
    label: 'Architect',
    description: 'Design and architecture planning',
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    value: 'review',
    label: 'Review',
    description: 'Code review and analysis',
    icon: <Eye className="w-4 h-4" />,
  },
  {
    value: 'security',
    label: 'Security',
    description: 'Security audit and fixes',
    icon: <Shield className="w-4 h-4" />,
  },
  {
    value: 'debug',
    label: 'Debug',
    description: 'Debugging and troubleshooting',
    icon: <Bug className="w-4 h-4" />,
  },
]

interface ModeSelectorProps {
  value: AIMode
  onChange: (mode: AIMode) => void
  disabled?: boolean
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const currentMode = modes.find(m => m.value === value) || modes[0]

  return (
    <div className="mode-selector">
      <label className="mode-selector-label">
        {currentMode.icon}
        AI Mode: <strong>{currentMode.label}</strong>
      </label>

      <div className="mode-buttons">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            disabled={disabled}
            className={`mode-button ${value === mode.value ? 'active' : ''}`}
            title={mode.description}
            data-mode={mode.value}
          >
            {mode.icon}
            <span className="mode-label">{mode.label}</span>
          </button>
        ))}
      </div>

      <p className="mode-description">{currentMode.description}</p>
    </div>
  )
}
