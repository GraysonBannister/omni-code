import React, { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  ListTodo,
  Play,
  Edit3,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react'
import type { ExecutionPlan, PlanStep } from './PlanningPanel'
import './InlinePlanCard.css'

interface InlinePlanCardProps {
  plan: ExecutionPlan | null
  onApprove: () => void
  onModify: () => void
  onReject: () => void
  onDismiss?: () => void
  isExecuting?: boolean
  onOpenFile?: () => void
}

const getStepStatusIcon = (status: NonNullable<PlanStep['status']>) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="ipc-step-icon completed" />
    case 'in_progress':
      return <Loader2 className="ipc-step-icon in-progress" />
    case 'failed':
      return <XCircle className="ipc-step-icon failed" />
    default:
      return <Circle className="ipc-step-icon pending" />
  }
}

export const InlinePlanCard: React.FC<InlinePlanCardProps> = ({
  plan,
  onApprove,
  onModify,
  onReject,
  onDismiss,
  isExecuting = false,
  onOpenFile,
}) => {
  const [expanded, setExpanded] = useState(false)

  if (!plan) return null

  const stepsWithStatus = plan.steps.map(s => ({ ...s, status: s.status ?? 'pending' }))
  const completedSteps = stepsWithStatus.filter(s => s.status === 'completed').length
  const totalSteps = stepsWithStatus.length
  const hasStarted = completedSteps > 0 || stepsWithStatus.some(s => s.status === 'in_progress')
  const allDone = completedSteps === totalSteps && totalSteps > 0

  const goalText = plan.goal ?? plan.description

  let statusLabel: string
  let statusClass: string
  if (isExecuting) {
    statusLabel = 'Executing…'
    statusClass = 'executing'
  } else if (allDone) {
    statusLabel = 'Built ✓'
    statusClass = 'done'
  } else if (hasStarted) {
    statusLabel = 'In Progress'
    statusClass = 'in-progress'
  } else {
    statusLabel = 'Pending Approval'
    statusClass = 'pending'
  }

  const stepSummary =
    hasStarted || allDone
      ? `${completedSteps} of ${totalSteps} To-dos Completed`
      : `${totalSteps} To-do${totalSteps !== 1 ? 's' : ''}`

  return (
    <div className={`ipc-card ${statusClass}`}>
      {/* Header */}
      <div className="ipc-header">
        <div className="ipc-header-left">
          <ListTodo className="ipc-plan-icon" />
          <span className="ipc-title">{plan.title}</span>
        </div>
        <div className="ipc-header-right">
          {onOpenFile && (
            <button
              className="ipc-open-file-btn"
              onClick={onOpenFile}
              title="Open plan file (.omnicode/plan.json)"
            >
              <FileText className="ipc-open-file-icon" />
            </button>
          )}
          <span className={`ipc-status-badge ${statusClass}`}>{statusLabel}</span>
        </div>
      </div>

      {/* Goal / description */}
      {goalText && (
        <p className="ipc-goal">{goalText}</p>
      )}

      {/* Footer row: step summary pill + expand toggle */}
      <div className="ipc-footer">
        <div className="ipc-step-summary">
          {isExecuting && <Loader2 className="ipc-summary-spinner" />}
          <span>{stepSummary}</span>
        </div>

        <button
          className="ipc-toggle"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>View Less <ChevronDown className="ipc-toggle-icon" /></>
          ) : (
            <>View Plan <ChevronRight className="ipc-toggle-icon" /></>
          )}
        </button>
      </div>

      {/* Expandable step list */}
      {expanded && (
        <div className="ipc-steps">
          <ul className="ipc-steps-list">
            {stepsWithStatus.map((step, i) => (
              <li key={step.id} className={`ipc-step ${step.status}`}>
                {getStepStatusIcon(step.status)}
                <div className="ipc-step-body">
                  {step.title
                    ? <span className="ipc-step-title">{step.title}</span>
                    : <span className="ipc-step-title">{step.description}</span>
                  }
                  {step.title && step.description && (
                    <span className="ipc-step-desc">{step.description}</span>
                  )}
                </div>
                <span className="ipc-step-num">{i + 1}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons — pending, not yet started */}
      {!isExecuting && !hasStarted && (
        <div className="ipc-actions">
          <button className="ipc-btn approve" onClick={onApprove}>
            <Play className="ipc-btn-icon" />
            Approve &amp; Execute
          </button>
          <button className="ipc-btn modify" onClick={onModify}>
            <Edit3 className="ipc-btn-icon" />
            Modify
          </button>
          <button className="ipc-btn reject" onClick={onReject}>
            <X className="ipc-btn-icon" />
            Reject
          </button>
        </div>
      )}

      {/* Dismiss — only shown during partial execution, not after all steps complete */}
      {!isExecuting && hasStarted && !allDone && onDismiss && (
        <div className="ipc-actions">
          <button className="ipc-btn dismiss" onClick={onDismiss}>
            <X className="ipc-btn-icon" />
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
