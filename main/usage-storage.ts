/**
 * Usage Storage Module
 *
 * Handles persisting usage data to both global (electron-store) and workspace-specific storage.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { UsageData, MonthlyUsage, UsageRecord } from '../src/core/usage-types.js';
import { USAGE_DATA_VERSION, DEFAULT_RETENTION_MONTHS } from '../src/core/usage-types.js';
import type StoreType from 'electron-store';

// Dynamic import for electron-store
let Store: typeof StoreType | null = null;

async function getStore(): Promise<typeof StoreType> {
  if (Store) return Store;
  const storeModule = await import('electron-store');
  Store = (storeModule as any).default || storeModule;
  return Store;
}

const USAGE_DIR = '.omni-code';
const USAGE_FILE = 'usage.json';

interface GlobalUsageStore {
  usage: UsageData;
  monthlyLimits: Record<string, number>; // month -> limit
}

export class UsageStorage {
  private globalStore: StoreType<GlobalUsageStore> | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const StoreClass = await getStore();
      this.globalStore = new StoreClass<GlobalUsageStore>({
        projectName: 'omni-code',
        name: 'usage',
        defaults: {
          usage: {
            version: USAGE_DATA_VERSION,
            monthly: [],
            allTimeTotal: 0,
            lastUpdated: Date.now(),
          },
          monthlyLimits: {},
        },
      });
      this.initialized = true;
    } catch (error) {
      console.error('[UsageStorage] Failed to initialize:', error);
      throw error;
    }
  }

  private ensureInitialized(): StoreType<GlobalUsageStore> {
    if (!this.globalStore || !this.initialized) {
      throw new Error('UsageStorage not initialized');
    }
    return this.globalStore;
  }

  /**
   * Get workspace usage file path
   */
  private getWorkspaceUsagePath(workspacePath: string): string {
    return path.join(workspacePath, USAGE_DIR, USAGE_FILE);
  }

  /**
   * Ensure usage directory exists
   */
  private async ensureUsageDir(workspacePath: string): Promise<void> {
    const usageDir = path.join(workspacePath, USAGE_DIR);
    await fs.mkdir(usageDir, { recursive: true });
  }

  /**
   * Record usage to both global and workspace storage
   */
  async recordUsage(
    record: UsageRecord,
    workspacePath?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update global storage
      this.updateGlobalUsage(record);

      // Update workspace storage if provided
      if (workspacePath) {
        await this.updateWorkspaceUsage(record, workspacePath);
      }

      return { success: true };
    } catch (error) {
      console.error('[UsageStorage] Failed to record usage:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update global usage store
   */
  private updateGlobalUsage(record: UsageRecord): void {
    const store = this.ensureInitialized();
    const usage = store.get('usage');

    const month = this.formatMonth(new Date(record.timestamp));
    let monthData = usage.monthly.find(m => m.month === month);

    if (!monthData) {
      monthData = {
        month,
        days: [],
        totalCost: 0,
        limit: store.get('monthlyLimits')[month],
        alertedAt: [],
      };
      usage.monthly.push(monthData);
    }

    // Add record to appropriate day
    const date = this.formatDate(new Date(record.timestamp));
    let day = monthData.days.find(d => d.date === date);
    if (!day) {
      day = {
        date,
        records: [],
        totalCost: 0,
        byModel: {},
        byProvider: {},
      };
      monthData.days.push(day);
    }

    day.records.push(record);
    day.totalCost += record.cost;
    day.byModel[record.model] = (day.byModel[record.model] || 0) + record.cost;
    day.byProvider[record.provider] = (day.byProvider[record.provider] || 0) + record.cost;

    monthData.totalCost += record.cost;
    usage.allTimeTotal += record.cost;
    usage.lastUpdated = Date.now();

    // Save back to store
    store.set('usage', usage);
  }

  /**
   * Update workspace-specific usage file
   */
  private async updateWorkspaceUsage(record: UsageRecord, workspacePath: string): Promise<void> {
    const usagePath = this.getWorkspaceUsagePath(workspacePath);

    let data: UsageData = {
      version: USAGE_DATA_VERSION,
      monthly: [],
      allTimeTotal: 0,
      lastUpdated: Date.now(),
    };

    // Try to load existing data
    try {
      const content = await fs.readFile(usagePath, 'utf-8');
      data = JSON.parse(content);
    } catch {
      // File doesn't exist yet, use default
    }

    const month = this.formatMonth(new Date(record.timestamp));
    let monthData = data.monthly.find(m => m.month === month);

    if (!monthData) {
      monthData = {
        month,
        days: [],
        totalCost: 0,
        alertedAt: [],
      };
      data.monthly.push(monthData);
    }

    const date = this.formatDate(new Date(record.timestamp));
    let day = monthData.days.find(d => d.date === date);
    if (!day) {
      day = {
        date,
        records: [],
        totalCost: 0,
        byModel: {},
        byProvider: {},
      };
      monthData.days.push(day);
    }

    day.records.push(record);
    day.totalCost += record.cost;
    day.byModel[record.model] = (day.byModel[record.model] || 0) + record.cost;
    day.byProvider[record.provider] = (day.byProvider[record.provider] || 0) + record.cost;

    monthData.totalCost += record.cost;
    data.allTimeTotal += record.cost;
    data.lastUpdated = Date.now();

    await this.ensureUsageDir(workspacePath);
    await fs.writeFile(usagePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Get usage data for a specific month
   */
  async getUsage(
    month?: string,
    workspacePath?: string
  ): Promise<{ usage?: UsageData; error?: string }> {
    try {
      // If workspace path provided, try to get workspace-specific data
      if (workspacePath) {
        const workspaceData = await this.getWorkspaceUsage(workspacePath, month);
        if (workspaceData) {
          return { usage: workspaceData };
        }
      }

      // Fall back to global usage
      const store = this.ensureInitialized();
      const usage = store.get('usage');

      if (month) {
        // Filter to specific month
        const monthData = usage.monthly.find(m => m.month === month);
        if (!monthData) {
          return { usage: { version: USAGE_DATA_VERSION, monthly: [], allTimeTotal: 0, lastUpdated: Date.now() } };
        }
        return {
          usage: {
            version: usage.version,
            monthly: [monthData],
            allTimeTotal: monthData.totalCost,
            lastUpdated: usage.lastUpdated,
          },
        };
      }

      return { usage };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Get usage data from a specific workspace
   */
  private async getWorkspaceUsage(workspacePath: string, month?: string): Promise<UsageData | null> {
    try {
      const usagePath = this.getWorkspaceUsagePath(workspacePath);
      const content = await fs.readFile(usagePath, 'utf-8');
      const data: UsageData = JSON.parse(content);

      if (month) {
        const monthData = data.monthly.find(m => m.month === month);
        if (!monthData) return null;
        return {
          version: data.version,
          monthly: [monthData],
          allTimeTotal: monthData.totalCost,
          lastUpdated: data.lastUpdated,
        };
      }

      return data;
    } catch {
      return null;
    }
  }

  /**
   * Get list of months with usage data
   */
  async getAvailableMonths(workspacePath?: string): Promise<string[]> {
    const months = new Set<string>();

    // Get from global
    try {
      const store = this.ensureInitialized();
      const usage = store.get('usage');
      usage.monthly.forEach(m => months.add(m.month));
    } catch {
      // Ignore
    }

    // Get from workspace if provided
    if (workspacePath) {
      try {
        const usagePath = this.getWorkspaceUsagePath(workspacePath);
        const content = await fs.readFile(usagePath, 'utf-8');
        const data: UsageData = JSON.parse(content);
        data.monthly.forEach(m => months.add(m.month));
      } catch {
        // Ignore
      }
    }

    return Array.from(months).sort();
  }

  /**
   * Set monthly spend limit
   */
  async setMonthlyLimit(month: string, limit: number): Promise<{ success: boolean; error?: string }> {
    try {
      const store = this.ensureInitialized();
      const limits = store.get('monthlyLimits');
      limits[month] = limit;
      store.set('monthlyLimits', limits);

      // Also update the month's limit in usage data
      const usage = store.get('usage');
      const monthData = usage.monthly.find(m => m.month === month);
      if (monthData) {
        monthData.limit = limit;
        store.set('usage', usage);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get monthly limit
   */
  async getMonthlyLimit(month: string): Promise<number | undefined> {
    try {
      const store = this.ensureInitialized();
      const limits = store.get('monthlyLimits');
      return limits[month];
    } catch {
      return undefined;
    }
  }

  /**
   * Get all monthly limits
   */
  async getAllMonthlyLimits(): Promise<Record<string, number>> {
    try {
      const store = this.ensureInitialized();
      return store.get('monthlyLimits');
    } catch {
      return {};
    }
  }

  /**
   * Clean up old data older than specified months
   */
  async cleanupOldData(monthsToKeep: number = DEFAULT_RETENTION_MONTHS): Promise<{ deleted: number; error?: string }> {
    try {
      const store = this.ensureInitialized();
      const usage = store.get('usage');

      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - monthsToKeep);
      const cutoffStr = this.formatMonth(cutoff);

      const originalCount = usage.monthly.length;
      usage.monthly = usage.monthly.filter(m => m.month >= cutoffStr);
      usage.lastUpdated = Date.now();

      store.set('usage', usage);

      return { deleted: originalCount - usage.monthly.length };
    } catch (error) {
      return { deleted: 0, error: (error as Error).message };
    }
  }

  /**
   * Export usage data to CSV format
   */
  async exportToCSV(workspacePath?: string): Promise<{ csv?: string; error?: string }> {
    try {
      const { usage } = await this.getUsage(undefined, workspacePath);
      if (!usage || usage.monthly.length === 0) {
        return { error: 'No usage data available' };
      }

      const headers = ['Date', 'Provider', 'Model', 'Input Tokens', 'Output Tokens', 'Cost'];
      const rows: string[] = [headers.join(',')];

      for (const month of usage.monthly) {
        for (const day of month.days) {
          for (const record of day.records) {
            const row = [
              new Date(record.timestamp).toISOString(),
              record.provider,
              record.model,
              record.inputTokens,
              record.outputTokens,
              record.cost.toFixed(4),
            ];
            rows.push(row.join(','));
          }
        }
      }

      return { csv: rows.join('\n') };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Get summary statistics
   */
  async getSummary(month?: string, workspacePath?: string): Promise<{
    totalCost: number;
    totalTokens: number;
    requestCount: number;
    byModel: Record<string, { cost: number; tokens: number }>;
    byProvider: Record<string, { cost: number; tokens: number }>;
    error?: string;
  }> {
    try {
      const { usage } = await this.getUsage(month, workspacePath);
      if (!usage) {
        return { totalCost: 0, totalTokens: 0, requestCount: 0, byModel: {}, byProvider: {} };
      }

      const monthsToProcess = month
        ? usage.monthly.filter(m => m.month === month)
        : usage.monthly;

      let totalCost = 0;
      let totalTokens = 0;
      let requestCount = 0;
      const byModel: Record<string, { cost: number; tokens: number }> = {};
      const byProvider: Record<string, { cost: number; tokens: number }> = {};

      for (const monthData of monthsToProcess) {
        totalCost += monthData.totalCost;

        for (const day of monthData.days) {
          for (const record of day.records) {
            requestCount++;
            const recordTokens = record.inputTokens + record.outputTokens;
            totalTokens += recordTokens;

            if (!byModel[record.model]) {
              byModel[record.model] = { cost: 0, tokens: 0 };
            }
            byModel[record.model].cost += record.cost;
            byModel[record.model].tokens += recordTokens;

            if (!byProvider[record.provider]) {
              byProvider[record.provider] = { cost: 0, tokens: 0 };
            }
            byProvider[record.provider].cost += record.cost;
            byProvider[record.provider].tokens += recordTokens;
          }
        }
      }

      return { totalCost, totalTokens, requestCount, byModel, byProvider };
    } catch (error) {
      return {
        totalCost: 0,
        totalTokens: 0,
        requestCount: 0,
        byModel: {},
        byProvider: {},
        error: (error as Error).message,
      };
    }
  }

  private formatMonth(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}

// Singleton instance
let usageStorage: UsageStorage | null = null;

export async function getUsageStorage(): Promise<UsageStorage> {
  if (!usageStorage) {
    usageStorage = new UsageStorage();
    await usageStorage.initialize();
  }
  return usageStorage;
}

export function resetUsageStorage(): void {
  usageStorage = null;
}
