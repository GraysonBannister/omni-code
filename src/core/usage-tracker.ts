/**
 * Usage Tracker
 *
 * Tracks API usage costs with monthly limit enforcement and alert capabilities.
 */

import type {
  UsageRecord,
  MonthlyUsage,
  MonthlyLimit,
  LimitCheckResult,
  UsageSummary,
  UsageFilters,
} from './usage-types.js';
import { DEFAULT_ALERT_THRESHOLDS, USAGE_DATA_VERSION } from './usage-types.js';

export interface UsageTrackerConfig {
  monthlyLimit?: number;
  alertThresholds?: number[];
  onLimitWarning?: (result: LimitCheckResult) => void;
  onLimitExceeded?: (result: LimitCheckResult) => void;
}

export class UsageTracker {
  private config: UsageTrackerConfig;
  private currentMonthData: MonthlyUsage | null = null;
  private sentAlerts: Set<number> = new Set();

  constructor(config: UsageTrackerConfig = {}) {
    this.config = {
      alertThresholds: DEFAULT_ALERT_THRESHOLDS,
      ...config,
    };
    this.initializeCurrentMonth();
  }

  private initializeCurrentMonth(): void {
    const now = new Date();
    const month = this.formatMonth(now);
    this.currentMonthData = {
      month,
      days: [],
      totalCost: 0,
      limit: this.config.monthlyLimit,
      alertedAt: [],
    };
  }

  private formatMonth(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  /**
   * Record a new usage entry
   */
  recordUsage(record: Omit<UsageRecord, 'timestamp'>): UsageRecord {
    const timestamp = Date.now();
    const fullRecord: UsageRecord = { ...record, timestamp };

    // Ensure we're tracking the correct month
    const recordMonth = this.formatMonth(new Date(timestamp));
    if (recordMonth !== this.currentMonthData?.month) {
      this.initializeCurrentMonth();
    }

    // Add to current month data
    if (this.currentMonthData) {
      this.currentMonthData.totalCost += record.cost;

      // Add to appropriate day
      const date = this.formatDate(new Date(timestamp));
      let day = this.currentMonthData.days.find(d => d.date === date);
      if (!day) {
        day = {
          date,
          records: [],
          totalCost: 0,
          byModel: {},
          byProvider: {},
        };
        this.currentMonthData.days.push(day);
      }

      day.records.push(fullRecord);
      day.totalCost += record.cost;
      day.byModel[record.model] = (day.byModel[record.model] || 0) + record.cost;
      day.byProvider[record.provider] = (day.byProvider[record.provider] || 0) + record.cost;

      // Check limits and send alerts
      this.checkLimitsAndAlert();
    }

    return fullRecord;
  }

  /**
   * Check if usage is within monthly limits
   */
  checkLimit(): LimitCheckResult {
    const limit = this.config.monthlyLimit;
    if (!limit || limit <= 0) {
      return { allowed: true, currentSpend: 0, limit: 0, percentage: 0 };
    }

    const currentSpend = this.currentMonthData?.totalCost || 0;
    const percentage = currentSpend / limit;

    let status: LimitCheckResult['allowed'] = true;
    let message: string | undefined;
    let warning = false;

    if (percentage >= 1.0) {
      status = false;
      message = `Monthly limit exceeded: $${currentSpend.toFixed(2)} / $${limit.toFixed(2)}`;
    } else if (percentage >= 0.95) {
      warning = true;
      message = `Warning: You've used ${(percentage * 100).toFixed(0)}% of your monthly limit`;
    } else if (percentage >= 0.8) {
      warning = true;
      message = `Notice: You've used ${(percentage * 100).toFixed(0)}% of your monthly limit`;
    }

    return {
      allowed: status,
      currentSpend,
      limit,
      percentage,
      message,
      warning,
    };
  }

  /**
   * Check limits and trigger alerts if needed
   */
  private checkLimitsAndAlert(): void {
    const result = this.checkLimit();
    const percentage = result.percentage;
    const thresholds = this.config.alertThresholds || DEFAULT_ALERT_THRESHOLDS;

    // Find the highest threshold crossed that hasn't been alerted
    for (const threshold of thresholds) {
      if (percentage >= threshold && !this.sentAlerts.has(threshold)) {
        this.sentAlerts.add(threshold);

        if (threshold >= 1.0 && this.config.onLimitExceeded) {
          this.config.onLimitExceeded(result);
        } else if (this.config.onLimitWarning) {
          this.config.onLimitWarning(result);
        }

        // Record alert in current month data
        if (this.currentMonthData) {
          if (!this.currentMonthData.alertedAt) {
            this.currentMonthData.alertedAt = [];
          }
          this.currentMonthData.alertedAt.push(Date.now());
        }
      }
    }
  }

  /**
   * Get current month's usage summary
   */
  getCurrentMonthSummary(): MonthlyLimit | null {
    if (!this.currentMonthData) return null;

    const limit = this.config.monthlyLimit || 0;
    const currentSpend = this.currentMonthData.totalCost;
    const percentage = limit > 0 ? currentSpend / limit : 0;

    // Calculate projected spend (based on current rate)
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const projectedSpend = dayOfMonth > 0 ? (currentSpend / dayOfMonth) * daysInMonth : currentSpend;

    let status: MonthlyLimit['status'] = 'under';
    if (percentage >= 1.0) {
      status = 'exceeded';
    } else if (percentage >= 0.95) {
      status = 'warning';
    } else if (percentage >= 0.8) {
      status = 'approaching';
    }

    return {
      month: this.currentMonthData.month,
      limit,
      currentSpend,
      projectedSpend,
      percentage,
      status,
    };
  }

  /**
   * Get usage summary for a specific time period
   */
  getSummary(filters?: UsageFilters): UsageSummary {
    if (!this.currentMonthData) {
      return {
        totalCost: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        requestCount: 0,
        byModel: {},
        byProvider: {},
      };
    }

    let records: UsageRecord[] = [];

    // Collect records from days
    for (const day of this.currentMonthData.days) {
      if (filters?.startDate && day.date < filters.startDate) continue;
      if (filters?.endDate && day.date > filters.endDate) continue;

      for (const record of day.records) {
        if (filters?.models && !filters.models.includes(record.model)) continue;
        if (filters?.providers && !filters.providers.includes(record.provider)) continue;
        if (filters?.conversationIds && record.conversationId &&
            !filters.conversationIds.includes(record.conversationId)) continue;

        records.push(record);
      }
    }

    const byModel: UsageSummary['byModel'] = {};
    const byProvider: UsageSummary['byProvider'] = {};

    for (const record of records) {
      if (!byModel[record.model]) {
        byModel[record.model] = { cost: 0, tokens: 0, requests: 0 };
      }
      byModel[record.model].cost += record.cost;
      byModel[record.model].tokens += record.inputTokens + record.outputTokens;
      byModel[record.model].requests += 1;

      if (!byProvider[record.provider]) {
        byProvider[record.provider] = { cost: 0, tokens: 0, requests: 0 };
      }
      byProvider[record.provider].cost += record.cost;
      byProvider[record.provider].tokens += record.inputTokens + record.outputTokens;
      byProvider[record.provider].requests += 1;
    }

    return {
      totalCost: records.reduce((sum, r) => sum + r.cost, 0),
      totalTokens: records.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0),
      inputTokens: records.reduce((sum, r) => sum + r.inputTokens, 0),
      outputTokens: records.reduce((sum, r) => sum + r.outputTokens, 0),
      requestCount: records.length,
      byModel,
      byProvider,
    };
  }

  /**
   * Get list of all models used in current month
   */
  getUsedModels(): string[] {
    if (!this.currentMonthData) return [];

    const models = new Set<string>();
    for (const day of this.currentMonthData.days) {
      for (const record of day.records) {
        models.add(record.model);
      }
    }

    return Array.from(models).sort();
  }

  /**
   * Get daily usage for charting
   */
  getDailyUsage(): Array<{ date: string; totalCost: number; byModel: Record<string, number> }> {
    if (!this.currentMonthData) return [];

    return this.currentMonthData.days
      .map(day => ({
        date: day.date,
        totalCost: day.totalCost,
        byModel: { ...day.byModel },
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Set monthly limit
   */
  setMonthlyLimit(limit: number): void {
    this.config.monthlyLimit = limit;
    if (this.currentMonthData) {
      this.currentMonthData.limit = limit;
    }
    // Re-check limits with new threshold
    this.sentAlerts.clear();
    this.checkLimitsAndAlert();
  }

  /**
   * Get current month data for storage
   */
  getCurrentMonthData(): MonthlyUsage | null {
    return this.currentMonthData;
  }

  /**
   * Load month data from storage
   */
  loadMonthData(data: MonthlyUsage): void {
    this.currentMonthData = data;
    // Restore sent alerts based on alertedAt
    if (data.alertedAt && data.limit) {
      const percentage = data.totalCost / data.limit;
      const thresholds = this.config.alertThresholds || DEFAULT_ALERT_THRESHOLDS;
      for (const threshold of thresholds) {
        if (percentage >= threshold) {
          this.sentAlerts.add(threshold);
        }
      }
    }
  }

  /**
   * Reset alerts (e.g., when user acknowledges or increases limit)
   */
  resetAlerts(): void {
    this.sentAlerts.clear();
  }

  /**
   * Get current configuration
   */
  getConfig(): UsageTrackerConfig {
    return { ...this.config };
  }
}

// Singleton instance
let globalUsageTracker: UsageTracker | null = null;

export function getUsageTracker(config?: UsageTrackerConfig): UsageTracker {
  if (!globalUsageTracker) {
    globalUsageTracker = new UsageTracker(config);
  }
  return globalUsageTracker;
}

export function resetUsageTracker(): void {
  globalUsageTracker = null;
}
