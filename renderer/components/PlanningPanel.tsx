import React, { useState } from 'react'
import { CheckCircle2, Circle, Loader2, XCircle, Clock, Play, X, Edit3, FileText, AlertTriangle, HelpCircle, ChevronDown, ChevronRight, FilePlus, FilePen, Trash2 } from 'lucide-react'
import './PlanningPanel.css'

export interface PlanStep {
  id: string
  description: string
  status?: 'pending' | 'in_progress' | 'completed' | 'failed'
  dependencies?: string[]
  // Extended fields from plan JSON
  title?: string
  files?: string[]
}

export interface PlanFile {
  path: string
  action: 'create' | 'modify' | 'delete'
  reason: string
}

export interface ExecutionPlan {
  id: string
  title: string
  description: string
  goal?: string
  steps: PlanStep[]
  estimatedDuration?: number
  files?: PlanFile[]
  risks?: string[]
  questions?: string[]
}

interface PlanningPanelProps {
  plan: ExecutionPlan | null
  onApprove: () => void
  onModify: () => void
  onReject: () => void
  onDismiss?: () => void
  isExecuting?: boolean
}

const FILE_ACTION_ICONS: Record<PlanFile['action'], React.ReactNode> = {
  create: <FilePlus className="w-3 h-3" />,
  modify: <FilePen className="w-3 h-3" />,
  delete: <Trash2 className="w-3 h-3" />,
}

const FILE_ACTION_LABELS: Record<PlanFile['action'], string> = {
  create: 'create',
  modify: 'modify',
  delete: 'delete',
}

export const PlanningPanel: React.FC<PlanningPanelProps> = ({
  plan,
  onApprove,
  onModify,
  onReject,
  onDismiss,
  isExecuting = false,
}) => {
  const [filesExpanded, setFilesExpanded] = useState(true)
  const [risksExpanded, setRisksExpanded] = useState(false)
  const [questionsExpanded, setQuestionsExpanded] = useState(true)

  if (!plan) {
    return (
      <div className="planning-panel empty">
        <p>No execution plan available</p>
      </div>
    )
  }

  const stepsWithStatus = plan.steps.map(s => ({ ...s, status: s.status ?? 'pending' }))
  const completedSteps = stepsWithStatus.filter(s => s.status === 'completed').length
  const totalSteps = stepsWithStatus.length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const hasStarted = completedSteps > 0 || stepsWithStatus.some(s => s.status === 'in_progress')

  const getStepStatusIcon = (status: NonNullable<PlanStep['status']>) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const goalText = plan.goal ?? plan.description

  return (
    <div className="planning-panel">
      <div className="plan-header">
        <div className="plan-header-top">
          <FileText className="w-4 h-4 plan-header-icon" />
          <h3 className="plan-title">{plan.title}</h3>
        </div>
        {goalText && (
          <p className="plan-goal">{goalText}</p>
        )}
        {plan.estimatedDuration && (
          <div className="plan-duration">
            <Clock className="w-4 h-4" />
            <span>Estimated: ~{plan.estimatedDuration}s</span>
          </div>
        )}
      </div>

      {/* Questions (show prominently if present) */}
      {plan.questions && plan.questions.length > 0 && (
        <div className="plan-section plan-questions">
          <button
            className="plan-section-toggle"
            onClick={() => setQuestionsExpanded(v => !v)}
          >
            <HelpCircle className="w-4 h-4 text-yellow-500" />
            <span>Clarifications needed ({plan.questions.length})</span>
            {questionsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {questionsExpanded && (
            <ul className="plan-section-list">
              {plan.questions.map((q, i) => (
                <li key={i} className="plan-question-item">
                  <span className="plan-question-bullet">?</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Files affected */}
      {plan.files && plan.files.length > 0 && (
        <div className="plan-section plan-files">
          <button
            className="plan-section-toggle"
            onClick={() => setFilesExpanded(v => !v)}
          >
            <FileText className="w-4 h-4" />
            <span>Files affected ({plan.files.length})</span>
            {filesExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {filesExpanded && (
            <ul className="plan-section-list">
              {plan.files.map((f, i) => (
                <li key={i} className={`plan-file-item plan-file-${f.action}`}>
                  <span className={`plan-file-badge plan-file-badge-${f.action}`}>
                    {FILE_ACTION_ICONS[f.action]}
                    {FILE_ACTION_LABELS[f.action]}
                  </span>
                  <span className="plan-file-path">{f.path}</span>
                  <span className="plan-file-reason">{f.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Steps */}
      <div className="plan-steps">
        <h4 className="steps-title">Implementation Steps</h4>
        {hasStarted && (
          <div className="plan-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">
              {completedSteps} of {totalSteps} steps completed
            </span>
          </div>
        )}
        <ul className="steps-list">
          {stepsWithStatus.map((step, index) => (
            <li
              key={step.id}
              className={`step-item ${step.status}`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-status-icon">
                {getStepStatusIcon(step.status)}
              </span>
              <div className="step-content">
                {step.title && (
                  <span className="step-title">{step.title}</span>
                )}
                <span className="step-description">{step.description}</span>
                {step.files && step.files.length > 0 && (
                  <span className="step-files">
                    {step.files.join(', ')}
                  </span>
                )}
                {step.dependencies && step.dependencies.length > 0 && (
                  <span className="step-dependencies">
                    Depends: {step.dependencies.join(', ')}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Risks */}
      {plan.risks && plan.risks.length > 0 && (
        <div className="plan-section plan-risks">
          <button
            className="plan-section-toggle"
            onClick={() => setRisksExpanded(v => !v)}
          >
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span>Risks & considerations ({plan.risks.length})</span>
            {risksExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {risksExpanded && (
            <ul className="plan-section-list">
              {plan.risks.map((r, i) => (
                <li key={i} className="plan-risk-item">
                  <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Actions */}
      {!isExecuting && !hasStarted && (
        <div className="plan-actions">
          <button
            className="plan-btn approve"
            onClick={onApprove}
          >
            <Play className="w-4 h-4" />
            Approve &amp; Execute
          </button>
          <button
            className="plan-btn modify"
            onClick={onModify}
          >
            <Edit3 className="w-4 h-4" />
            Modify Plan
          </button>
          <button
            className="plan-btn reject"
            onClick={onReject}
          >
            <X className="w-4 h-4" />
            Reject
          </button>
        </div>
      )}

      {isExecuting && (
        <div className="plan-executing">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Executing plan...</span>
        </div>
      )}

      {/* Dismiss button — shown after execution finishes (plan has started but agent is no longer running) */}
      {!isExecuting && hasStarted && onDismiss && (
        <div className="plan-actions plan-actions-dismiss">
          <button
            className="plan-btn plan-btn-dismiss"
            onClick={onDismiss}
          >
            <X className="w-4 h-4" />
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
