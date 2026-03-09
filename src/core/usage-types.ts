/**
 * Usage Tracking Types
 *
 * Defines the data structures for tracking API usage costs across models and time periods.
 */

export interface UsageRecord {
  timestamp: number;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  conversationId?: string;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  records: UsageRecord[];
  totalCost: number;
  byModel: Record<string, number>;
  byProvider: Record<string, number>;
}

export interface MonthlyUsage {
  month: string; // YYYY-MM
  days: DailyUsage[];
  totalCost: number;
  limit?: number;
  alertedAt?: number[]; // timestamps when alerts were sent
}

export interface UsageData {
  version: string;
  monthly: MonthlyUsage[];
  allTimeTotal: number;
  lastUpdated: number;
}

export interface UsageSummary {
  totalCost: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
  byModel: Record<string, { cost: number; tokens: number; requests: number }>;
  byProvider: Record<string, { cost: number; tokens: number; requests: number }>;
}

export interface UsageFilters {
  startDate?: string;
  endDate?: string;
  models?: string[];
  providers?: string[];
  conversationIds?: string[];
}

export interface MonthlyLimit {
  month: string;
  limit: number;
  currentSpend: number;
  projectedSpend: number;
  percentage: number;
  status: 'under' | 'approaching' | 'warning' | 'exceeded';
}

export interface LimitCheckResult {
  allowed: boolean;
  currentSpend: number;
  limit: number;
  percentage: number;
  message?: string;
  warning?: boolean;
}

// Alert thresholds as percentages
export const DEFAULT_ALERT_THRESHOLDS = [0.8, 0.95, 1.0]; // 80%, 95%, 100%

// Storage version for migration
export const USAGE_DATA_VERSION = '1.0.0';

// Default data retention period (months)
export const DEFAULT_RETENTION_MONTHS = 12;
