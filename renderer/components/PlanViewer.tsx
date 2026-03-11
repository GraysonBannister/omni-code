import React, { useEffect, useState, useCallback } from 'react';
import { FileText, CheckSquare, Square, RefreshCw, ListTodo, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import './PlanViewer.css';

interface PlanTask {
  description: string;
  checked: boolean;
  section: string;
}

interface PlanSection {
  title: string;
  tasks: PlanTask[];
  expanded: boolean;
}

interface PlanData {
  title: string;
  description?: string;
  progress: {
    total: number;
    checked: number;
    percent: number;
  };
  sections: PlanSection[];
  notes?: string;
  exists: boolean;
}

export const PlanViewer: React.FC = () => {
  const { projectPath } = useAppStore();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const loadPlan = useCallback(async () => {
    if (!projectPath || !window.electronAPI?.tool) return;

    setIsLoading(true);
    try {
      const result = await window.electronAPI.tool.execute('ReadPlan', {
        format: 'structured',
      });

      if (result && !result.error && result.metadata?.plan) {
        const planData = result.metadata.plan;
        setPlan({
          ...planData,
          exists: result.metadata.exists,
        });
        // Expand all sections by default
        setExpandedSections(new Set(planData.sections.map((s: PlanSection) => s.title)));
      } else {
        setPlan(null);
      }
    } catch (error) {
      console.error('Failed to load plan:', error);
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath]);

  useEffect(() => {
    loadPlan();

    // Refresh every 10 seconds when plan exists
    const interval = setInterval(() => {
      if (plan?.exists) {
        loadPlan();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [loadPlan, plan?.exists]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  const handleCheckTask = async (section: string, task: string, checked: boolean) => {
    if (!window.electronAPI?.tool) return;

    try {
      await window.electronAPI.tool.execute('UpdatePlan', {
        action: checked ? 'check' : 'uncheck',
        section,
        task,
      });
      loadPlan();
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  };

  if (!projectPath) {
    return null;
  }

  if (isLoading && !plan) {
    return (
      <div className="plan-viewer loading">
        <RefreshCw size={16} className="spinner" />
        <span>Loading plan...</span>
      </div>
    );
  }

  if (!plan || !plan.exists) {
    return (
      <div className="plan-viewer empty">
        <FileText size={24} />
        <p>No PLAN.md found</p>
        <span className="hint">Use CreatePlan in architect mode to create a plan</span>
      </div>
    );
  }

  return (
    <div className="plan-viewer">
      <div className="plan-header">
        <div className="plan-title-row">
          <ListTodo size={18} />
          <h3 className="plan-title">{plan.title || 'Project Plan'}</h3>
          <button
            className="plan-refresh-btn"
            onClick={loadPlan}
            disabled={isLoading}
            title="Refresh plan"
          >
            <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
          </button>
        </div>

        <div className="plan-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${plan.progress.percent}%` }}
            />
          </div>
          <span className="progress-text">
            {plan.progress.checked}/{plan.progress.total} ({plan.progress.percent}%)
          </span>
        </div>
      </div>

      {plan.description && (
        <div className="plan-description">{plan.description}</div>
      )}

      <div className="plan-sections">
        {plan.sections.map((section) => (
          <div key={section.title} className="plan-section">
            <button
              className="section-header"
              onClick={() => toggleSection(section.title)}
            >
              {expandedSections.has(section.title) ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              <span className="section-title">{section.title}</span>
              <span className="section-count">
                {section.tasks.filter(t => t.checked).length}/{section.tasks.length}
              </span>
            </button>

            {expandedSections.has(section.title) && (
              <div className="section-tasks">
                {section.tasks.map((task, idx) => (
                  <div
                    key={`${section.title}-${idx}`}
                    className={`plan-task ${task.checked ? 'checked' : ''}`}
                    onClick={() => handleCheckTask(section.title, task.description, !task.checked)}
                  >
                    {task.checked ? (
                      <CheckSquare size={14} className="task-checkbox checked" />
                    ) : (
                      <Square size={14} className="task-checkbox" />
                    )}
                    <span className="task-description">{task.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {plan.notes && (
        <div className="plan-notes">
          <h4>Notes</h4>
          <pre>{plan.notes}</pre>
        </div>
      )}
    </div>
  );
};
