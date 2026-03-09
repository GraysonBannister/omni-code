import type { TokenUsage, ModelInfo } from '../providers/provider-types.js';
import { findModelInfo } from '../providers/model-registry.js';
import type { UsageRecord } from './usage-types.js';

export interface CostTrackerConfig {
  onUsageRecorded?: (record: UsageRecord) => void;
  conversationId?: string;
}

export class CostTracker {
  private _totalCost = 0;
  private _totalInputTokens = 0;
  private _totalOutputTokens = 0;
  private turns: Array<{ model: string; usage: TokenUsage; cost: number }> = [];
  private config: CostTrackerConfig;

  constructor(config: CostTrackerConfig = {}) {
    this.config = config;
  }

  get totalCost(): number {
    return this._totalCost;
  }

  get totalInputTokens(): number {
    return this._totalInputTokens;
  }

  get totalOutputTokens(): number {
    return this._totalOutputTokens;
  }

  get turnCount(): number {
    return this.turns.length;
  }

  calculateCost(modelId: string, usage: TokenUsage, provider?: string): number {
    const model = findModelInfo(modelId);
    if (!model) return 0;

    const inputCost = (usage.inputTokens / 1_000_000) * model.pricing.inputPerMillion;
    const outputCost = (usage.outputTokens / 1_000_000) * model.pricing.outputPerMillion;

    let cacheCost = 0;
    if (usage.cacheReadTokens && model.pricing.cacheReadPerMillion) {
      cacheCost += (usage.cacheReadTokens / 1_000_000) * model.pricing.cacheReadPerMillion;
    }
    if (usage.cacheWriteTokens && model.pricing.cacheWritePerMillion) {
      cacheCost += (usage.cacheWriteTokens / 1_000_000) * model.pricing.cacheWritePerMillion;
    }

    const turnCost = inputCost + outputCost + cacheCost;

    this._totalCost += turnCost;
    this._totalInputTokens += usage.inputTokens;
    this._totalOutputTokens += usage.outputTokens;
    this.turns.push({ model: modelId, usage, cost: turnCost });

    // Record usage if callback provided
    if (this.config.onUsageRecorded) {
      const record: UsageRecord = {
        timestamp: Date.now(),
        provider: provider || model.provider,
        model: modelId,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cost: turnCost,
        conversationId: this.config.conversationId,
      };
      this.config.onUsageRecorded(record);
    }

    return turnCost;
  }

  getSummary(): string {
    return [
      `Total cost: $${this._totalCost.toFixed(4)}`,
      `Input tokens: ${this._totalInputTokens.toLocaleString()}`,
      `Output tokens: ${this._totalOutputTokens.toLocaleString()}`,
      `Turns: ${this.turns.length}`,
    ].join(' | ');
  }

  reset(): void {
    this._totalCost = 0;
    this._totalInputTokens = 0;
    this._totalOutputTokens = 0;
    this.turns = [];
  }

  /**
   * Update configuration (e.g., to set conversation ID after creation)
   */
  updateConfig(config: Partial<CostTrackerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
