import React from 'react'
import { CheckCircle2, Circle, Loader2, XCircle, Clock, Play, X, Edit3 } from 'lucide-react'
import './PlanningPanel.css'

export interface PlanStep {
  id: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  dependencies?: string[]
}

export interface ExecutionPlan {
  id: string
  title: string
  description: string
  steps: PlanStep[]
  estimatedDuration?: number
}

interface PlanningPanelProps {
  plan: ExecutionPlan | null
  onApprove: () => void
  onModify: () => void
  onReject: () => void
  isExecuting?: boolean
}

export const PlanningPanel: React.FC<PlanningPanelProps> = ({
  plan,
  onApprove,
  onModify,
  onReject,
  isExecuting = false,
}) => {
  if (!plan) {
    return (
      <div className="planning-panel empty">
        <p>No execution plan available</p>
      </div>
    )
  }

  const completedSteps = plan.steps.filter(s => s.status === 'completed').length
  const totalSteps = plan.steps.length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  const getStepStatusIcon = (status: PlanStep['status']) => {
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

  return (
    <div className="planning-panel">
      <div className="plan-header">
        <h3 className="plan-title">{plan.title}</h3>
        <p className="plan-description">{plan.description}</p>
        {plan.estimatedDuration && (
          <div className="plan-duration">
            <Clock className="w-4 h-4" />
            <span>Estimated: ~{plan.estimatedDuration}s</span>
          </div>
        )}
      </div>

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

      <div className="plan-steps">
        <h4 className="steps-title">Execution Steps</h4>
        <ul className="steps-list">
          {plan.steps.map((step, index) => (
            <li
              key={step.id}
              className={`step-item ${step.status}`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-status-icon">
                {getStepStatusIcon(step.status)}
              </span>
              <span className="step-description">{step.description}</span>
              {step.dependencies && step.dependencies.length > 0 && (
                <span className="step-dependencies">
                  Depends: {step.dependencies.join(', ')}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {!isExecuting && completedSteps === 0 && (
        <div className="plan-actions">
          <button
            className="plan-btn approve"
            onClick={onApprove}
          >
            <Play className="w-4 h-4" />
            Approve & Execute
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
    </div>
  )
}
