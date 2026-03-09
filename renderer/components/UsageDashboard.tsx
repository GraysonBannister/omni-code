import React, { useState, useEffect, useCallback } from 'react';
import { Download, AlertTriangle, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { useSettingsStore } from '../stores/settingsStore';
import './UsageDashboard.css';

interface DailyUsage {
  date: string;
  totalCost: number;
  byModel: Record<string, number>;
}

interface UsageSummary {
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  byModel: Record<string, { cost: number; tokens: number }>;
  byProvider: Record<string, { cost: number; tokens: number }>;
}

export const UsageDashboard: React.FC = () => {
  const { projectPath } = useAppStore();
  const { settings, setSetting } = useSettingsStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(settings?.usage?.monthlyLimit || 0);

  // Get current month
  useEffect(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(month);
  }, []);

  // Load usage data
  const loadUsageData = useCallback(async () => {
    if (!window.electronAPI?.usage) return;

    setLoading(true);
    setError(null);

    try {
      // Get available months
      const months = await window.electronAPI.usage.getAvailableMonths(projectPath || undefined);
      setAvailableMonths(months);

      // Get summary
      const summaryResult = await window.electronAPI.usage.getSummary(selectedMonth || undefined, projectPath || undefined);
      if (summaryResult.error) {
        setError(summaryResult.error);
      } else {
        setSummary(summaryResult);

        // Initialize selected models with all models
        const models = Object.keys(summaryResult.byModel);
        if (selectedModels.length === 0 && models.length > 0) {
          setSelectedModels(models);
        }
      }

      // Get detailed usage
      const usageResult = await window.electronAPI.usage.get(selectedMonth || undefined, projectPath || undefined);
      if (usageResult.usage && 'monthly' in usageResult.usage) {
        const monthly = (usageResult.usage as any).monthly as Array<{ days: DailyUsage[] }>;
        if (monthly && monthly.length > 0) {
          const days = monthly[0].days || [];
          setDailyUsage(days.sort((a, b) => a.date.localeCompare(b.date)));
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectPath, selectedMonth, selectedModels.length]);

  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  // Filter daily usage by selected models
  const filteredDailyUsage = dailyUsage.map(day => {
    const filteredByModel: Record<string, number> = {};
    let filteredTotal = 0;

    for (const [model, cost] of Object.entries(day.byModel)) {
      if (selectedModels.includes(model)) {
        filteredByModel[model] = cost;
        filteredTotal += cost;
      }
    }

    return {
      ...day,
      totalCost: filteredTotal,
      byModel: filteredByModel,
    };
  });

  // Calculate projected monthly spend
  const projectedSpend = (() => {
    if (!summary) return 0;
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return dayOfMonth > 0 ? (summary.totalCost / dayOfMonth) * daysInMonth : summary.totalCost;
  })();

  // Calculate limit percentage
  const limitPercentage = monthlyLimit > 0 && summary
    ? (summary.totalCost / monthlyLimit) * 100
    : 0;

  // Get limit status color
  const getLimitStatusColor = () => {
    if (limitPercentage >= 100) return 'var(--color-error)';
    if (limitPercentage >= 95) return 'var(--color-warning)';
    if (limitPercentage >= 80) return 'var(--color-info)';
    return 'var(--color-success)';
  };

  // Handle model toggle
  const toggleModel = (model: string) => {
    setSelectedModels(prev =>
      prev.includes(model)
        ? prev.filter(m => m !== model)
        : [...prev, model]
    );
  };

  // Handle export
  const handleExport = async () => {
    if (!window.electronAPI?.usage) return;

    try {
      const result = await window.electronAPI.usage.export(projectPath || undefined);
      if (result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usage-${selectedMonth || 'all'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export usage:', err);
    }
  };

  // Handle limit change
  const handleLimitChange = async (value: number) => {
    setMonthlyLimit(value);
    if (settings) {
      await setSetting('usage.monthlyLimit', value || null);
    }

    // Update limit in storage
    if (window.electronAPI?.usage && selectedMonth) {
      await window.electronAPI.usage.setLimit(selectedMonth, value);
    }
  };

  // Get all unique models from usage data
  const allModels = (() => {
    const models = new Set<string>();
    for (const day of dailyUsage) {
      for (const model of Object.keys(day.byModel)) {
        models.add(model);
      }
    }
    return Array.from(models).sort();
  })();

  // Generate chart data
  const chartData = filteredDailyUsage.map(day => {
    const entry: Record<string, number | string> = { date: day.date };
    for (const [model, cost] of Object.entries(day.byModel)) {
      entry[model] = cost;
    }
    return entry;
  });

  if (loading) {
    return (
      <div className="usage-dashboard">
        <div className="usage-loading">Loading usage data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="usage-dashboard">
        <div className="usage-error">
          <AlertTriangle size={24} />
          <p>Failed to load usage data: {error}</p>
          <button className="btn btn-secondary" onClick={loadUsageData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="usage-dashboard">
      {/* Header */}
      <div className="usage-header">
        <div className="usage-month-selector">
          <label>Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {availableMonths.length === 0 && (
              <option value={selectedMonth}>{selectedMonth}</option>
            )}
            {availableMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleExport}>
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="usage-summary-cards">
          <div className="usage-card">
            <div className="usage-card-icon">
              <DollarSign size={20} />
            </div>
            <div className="usage-card-content">
              <span className="usage-card-label">Total Cost</span>
              <span className="usage-card-value">${summary.totalCost.toFixed(4)}</span>
            </div>
          </div>

          <div className="usage-card">
            <div className="usage-card-icon">
              <BarChart3 size={20} />
            </div>
            <div className="usage-card-content">
              <span className="usage-card-label">Total Tokens</span>
              <span className="usage-card-value">{summary.totalTokens.toLocaleString()}</span>
            </div>
          </div>

          <div className="usage-card">
            <div className="usage-card-icon">
              <TrendingUp size={20} />
            </div>
            <div className="usage-card-content">
              <span className="usage-card-label">Projected</span>
              <span className="usage-card-value">${projectedSpend.toFixed(2)}</span>
            </div>
          </div>

          {monthlyLimit > 0 && (
            <div className="usage-card usage-card-limit">
              <div className="usage-card-icon" style={{ color: getLimitStatusColor() }}>
                <AlertTriangle size={20} />
              </div>
              <div className="usage-card-content">
                <span className="usage-card-label">Limit Used</span>
                <span className="usage-card-value" style={{ color: getLimitStatusColor() }}>
                  {limitPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Monthly Limit Panel */}
      <div className="usage-limit-panel">
        <h4>Monthly Spend Limit</h4>
        <div className="usage-limit-input-row">
          <span className="usage-currency">$</span>
          <input
            type="number"
            value={monthlyLimit || ''}
            onChange={(e) => handleLimitChange(parseFloat(e.target.value) || 0)}
            placeholder="No limit"
            min={0}
            step={1}
            className="usage-limit-input"
          />
          <span className="usage-currency-label">USD</span>
        </div>
        {monthlyLimit > 0 && summary && (
          <div className="usage-limit-progress">
            <div
              className="usage-limit-progress-bar"
              style={{
                width: `${Math.min(limitPercentage, 100)}%`,
                backgroundColor: getLimitStatusColor(),
              }}
            />
            <span className="usage-limit-progress-text">
              ${summary.totalCost.toFixed(2)} / ${monthlyLimit.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Model Filter */}
      {allModels.length > 0 && (
        <div className="usage-model-filter">
          <div className="usage-filter-header">
            <h4>Filter by Model</h4>
            <div className="usage-filter-actions">
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setSelectedModels(allModels)}
              >
                Select All
              </button>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setSelectedModels([])}
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="usage-model-checkboxes">
            {allModels.map(model => (
              <label key={model} className="usage-model-checkbox">
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model)}
                  onChange={() => toggleModel(model)}
                />
                <span className="usage-model-name">{model}</span>
                {summary?.byModel[model] && (
                  <span className="usage-model-cost">
                    ${summary.byModel[model].cost.toFixed(4)}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Simple Bar Chart */}
      {chartData.length > 0 && (
        <div className="usage-chart-container">
          <h4>Daily Usage</h4>
          <div className="usage-chart">
            {chartData.map((day, index) => {
              const totalCost = Object.entries(day)
                .filter(([key]) => key !== 'date')
                .reduce((sum, [, cost]) => sum + (cost as number), 0);

              const maxCost = Math.max(...chartData.map(d =>
                Object.entries(d)
                  .filter(([key]) => key !== 'date')
                  .reduce((sum, [, cost]) => sum + (cost as number), 0)
              ));

              const height = maxCost > 0 ? (totalCost / maxCost) * 100 : 0;

              return (
                <div key={index} className="usage-chart-bar-wrapper">
                  <div
                    className="usage-chart-bar"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: $${totalCost.toFixed(4)}`}
                  >
                    {Object.entries(day)
                      .filter(([key]) => key !== 'date')
                      .map(([model, cost], i) => (
                        <div
                          key={model}
                          className="usage-chart-segment"
                          style={{
                            height: `${totalCost > 0 ? ((cost as number) / totalCost) * 100 : 0}%`,
                            backgroundColor: getModelColor(model, i),
                          }}
                          title={`${model}: $${(cost as number).toFixed(4)}`}
                        />
                      ))}
                  </div>
                  <span className="usage-chart-label">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Model Breakdown Table */}
      {summary && Object.keys(summary.byModel).length > 0 && (
        <div className="usage-breakdown">
          <h4>Cost Breakdown by Model</h4>
          <table className="usage-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Cost</th>
                <th>Tokens</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary.byModel)
                .sort((a, b) => b[1].cost - a[1].cost)
                .map(([model, data]) => (
                  <tr key={model}>
                    <td>{model}</td>
                    <td>${data.cost.toFixed(4)}</td>
                    <td>{data.tokens.toLocaleString()}</td>
                    <td>
                      {summary.totalCost > 0
                        ? ((data.cost / summary.totalCost) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Provider Breakdown Table */}
      {summary && Object.keys(summary.byProvider).length > 0 && (
        <div className="usage-breakdown">
          <h4>Cost Breakdown by Provider</h4>
          <table className="usage-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Cost</th>
                <th>Tokens</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary.byProvider)
                .sort((a, b) => b[1].cost - a[1].cost)
                .map(([provider, data]) => (
                  <tr key={provider}>
                    <td>{provider}</td>
                    <td>${data.cost.toFixed(4)}</td>
                    <td>{data.tokens.toLocaleString()}</td>
                    <td>
                      {summary.totalCost > 0
                        ? ((data.cost / summary.totalCost) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Data Message */}
      {!loading && !error && (!summary || summary.totalCost === 0) && (
        <div className="usage-empty">
          <p>No usage data available for this period.</p>
          <p className="usage-empty-hint">
            API usage will be recorded automatically as you use the chat.
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to generate consistent colors for models
function getModelColor(model: string, index: number): string {
  const colors = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
    '#6366f1', // indigo
    '#f97316', // orange
  ];

  // Generate consistent hash for model name
  let hash = 0;
  for (let i = 0; i < model.length; i++) {
    hash = model.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
