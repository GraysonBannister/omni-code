import React, { useState, useRef, useEffect } from 'react'
import { Code, Building2, Eye, Shield, Bug, Check, ChevronDown } from 'lucide-react'
import './ModeSelector.css'

export type AIMode = 'code' | 'architect' | 'review' | 'security' | 'debug' | 'ask'

interface AIModeConfig {
  value: AIMode
  label: string
  description: string
  icon: React.ReactNode
  infinityIcon?: boolean
}

// Custom infinity symbol icon
const InfinityIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 8c-2.2 0-4 1.8-4 4s1.8 4 4 4c1.5 0 2.8-.8 3.5-2l.5-1 .5 1c.7 1.2 2 2 3.5 2 2.2 0 4-1.8 4-4s-1.8-4-4-4c-1.5 0-2.8.8-3.5 2l-.5 1-.5-1C10.8 8.8 9.5 8 8 8" />
  </svg>
)

// Plan/target icon (bullseye)
const PlanIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

// Ask/speech bubble icon
const AskIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const modes: AIModeConfig[] = [
  {
    value: 'code',
    label: 'Code',
    description: 'General coding assistance',
    icon: <InfinityIcon className="w-4 h-4" />,
    infinityIcon: true,
  },
  {
    value: 'architect',
    label: 'Architect',
    description: 'Design and architecture planning',
    icon: <PlanIcon className="w-4 h-4" />,
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
  {
    value: 'ask',
    label: 'Ask',
    description: 'Ask questions and get answers',
    icon: <AskIcon className="w-4 h-4" />,
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
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentMode = modes.find(m => m.value === value) || modes[0]

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard shortcut (⌘I) to toggle dropdown
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'i') {
        event.preventDefault()
        if (!disabled) {
          setIsOpen(prev => !prev)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [disabled])

  const handleModeSelect = (mode: AIMode) => {
    onChange(mode)
    setIsOpen(false)
  }

  return (
    <div className="mode-selector" ref={dropdownRef}>
      {/* Compact trigger button */}
      <button
        className={`mode-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        title={`${currentMode.label} mode (⌘I)`}
      >
        <span className="mode-trigger-icon">{currentMode.icon}</span>
        <span className="mode-trigger-label">{currentMode.label}</span>
        <span className="mode-trigger-shortcut">⌘I</span>
        <span className="mode-trigger-arrow">
          {isOpen ? <Check className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="mode-dropdown">
          {modes.map((mode, index) => (
            <React.Fragment key={mode.value}>
              <button
                className={`mode-dropdown-item ${value === mode.value ? 'active' : ''}`}
                onClick={() => handleModeSelect(mode.value as AIMode)}
                disabled={disabled}
                title={mode.description}
              >
                <span className="mode-dropdown-item-icon">{mode.icon}</span>
                <span className="mode-dropdown-item-label">{mode.label}</span>
                {value === mode.value && (
                  <span className="mode-dropdown-item-check">
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </button>
              {index < modes.length - 1 && <div className="mode-dropdown-divider" />}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
