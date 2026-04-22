"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main/usage-storage.ts
var usage_storage_exports = {};
__export(usage_storage_exports, {
  UsageStorage: () => UsageStorage,
  getUsageStorage: () => getUsageStorage,
  resetUsageStorage: () => resetUsageStorage
});
module.exports = __toCommonJS(usage_storage_exports);
var fs = __toESM(require("fs/promises"), 1);
var path = __toESM(require("path"), 1);

// src/core/usage-types.ts
var USAGE_DATA_VERSION = "1.0.0";
var DEFAULT_RETENTION_MONTHS = 12;

// main/usage-storage.ts
var Store = null;
async function getStore() {
  if (Store)
    return Store;
  const storeModule = await import("electron-store");
  Store = storeModule.default || storeModule;
  return Store;
}
var USAGE_DIR = ".omnicode";
var USAGE_FILE = "usage.json";
var UsageStorage = class {
  globalStore = null;
  initialized = false;
  async initialize() {
    if (this.initialized)
      return;
    try {
      const StoreClass = await getStore();
      this.globalStore = new StoreClass({
        projectName: "omni-code",
        name: "usage",
        defaults: {
          usage: {
            version: USAGE_DATA_VERSION,
            monthly: [],
            allTimeTotal: 0,
            lastUpdated: Date.now()
          },
          monthlyLimits: {}
        }
      });
      this.initialized = true;
    } catch (error) {
      console.error("[UsageStorage] Failed to initialize:", error);
      throw error;
    }
  }
  ensureInitialized() {
    if (!this.globalStore || !this.initialized) {
      throw new Error("UsageStorage not initialized");
    }
    return this.globalStore;
  }
  /**
   * Get workspace usage file path
   */
  getWorkspaceUsagePath(workspacePath) {
    return path.join(workspacePath, USAGE_DIR, USAGE_FILE);
  }
  /**
   * Ensure usage directory exists
   */
  async ensureUsageDir(workspacePath) {
    const usageDir = path.join(workspacePath, USAGE_DIR);
    await fs.mkdir(usageDir, { recursive: true });
  }
  /**
   * Record usage to both global and workspace storage
   */
  async recordUsage(record, workspacePath) {
    try {
      this.updateGlobalUsage(record);
      if (workspacePath) {
        await this.updateWorkspaceUsage(record, workspacePath);
      }
      return { success: true };
    } catch (error) {
      console.error("[UsageStorage] Failed to record usage:", error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Update global usage store
   */
  updateGlobalUsage(record) {
    const store = this.ensureInitialized();
    const usage = store.get("usage");
    const month = this.formatMonth(new Date(record.timestamp));
    let monthData = usage.monthly.find((m) => m.month === month);
    if (!monthData) {
      monthData = {
        month,
        days: [],
        totalCost: 0,
        limit: store.get("monthlyLimits")[month],
        alertedAt: []
      };
      usage.monthly.push(monthData);
    }
    const date = this.formatDate(new Date(record.timestamp));
    let day = monthData.days.find((d) => d.date === date);
    if (!day) {
      day = {
        date,
        records: [],
        totalCost: 0,
        byModel: {},
        byProvider: {}
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
    store.set("usage", usage);
  }
  /**
   * Update workspace-specific usage file
   */
  async updateWorkspaceUsage(record, workspacePath) {
    const usagePath = this.getWorkspaceUsagePath(workspacePath);
    let data = {
      version: USAGE_DATA_VERSION,
      monthly: [],
      allTimeTotal: 0,
      lastUpdated: Date.now()
    };
    try {
      const content = await fs.readFile(usagePath, "utf-8");
      data = JSON.parse(content);
    } catch {
    }
    const month = this.formatMonth(new Date(record.timestamp));
    let monthData = data.monthly.find((m) => m.month === month);
    if (!monthData) {
      monthData = {
        month,
        days: [],
        totalCost: 0,
        alertedAt: []
      };
      data.monthly.push(monthData);
    }
    const date = this.formatDate(new Date(record.timestamp));
    let day = monthData.days.find((d) => d.date === date);
    if (!day) {
      day = {
        date,
        records: [],
        totalCost: 0,
        byModel: {},
        byProvider: {}
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
    await fs.writeFile(usagePath, JSON.stringify(data, null, 2), "utf-8");
  }
  /**
   * Get usage data for a specific month
   */
  async getUsage(month, workspacePath) {
    try {
      if (workspacePath) {
        const workspaceData = await this.getWorkspaceUsage(workspacePath, month);
        if (workspaceData) {
          return { usage: workspaceData };
        }
      }
      const store = this.ensureInitialized();
      const usage = store.get("usage");
      if (month) {
        const monthData = usage.monthly.find((m) => m.month === month);
        if (!monthData) {
          return { usage: { version: USAGE_DATA_VERSION, monthly: [], allTimeTotal: 0, lastUpdated: Date.now() } };
        }
        return {
          usage: {
            version: usage.version,
            monthly: [monthData],
            allTimeTotal: monthData.totalCost,
            lastUpdated: usage.lastUpdated
          }
        };
      }
      return { usage };
    } catch (error) {
      return { error: error.message };
    }
  }
  /**
   * Get usage data from a specific workspace
   */
  async getWorkspaceUsage(workspacePath, month) {
    try {
      const usagePath = this.getWorkspaceUsagePath(workspacePath);
      const content = await fs.readFile(usagePath, "utf-8");
      const data = JSON.parse(content);
      if (month) {
        const monthData = data.monthly.find((m) => m.month === month);
        if (!monthData)
          return null;
        return {
          version: data.version,
          monthly: [monthData],
          allTimeTotal: monthData.totalCost,
          lastUpdated: data.lastUpdated
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
  async getAvailableMonths(workspacePath) {
    const months = /* @__PURE__ */ new Set();
    try {
      const store = this.ensureInitialized();
      const usage = store.get("usage");
      usage.monthly.forEach((m) => months.add(m.month));
    } catch {
    }
    if (workspacePath) {
      try {
        const usagePath = this.getWorkspaceUsagePath(workspacePath);
        const content = await fs.readFile(usagePath, "utf-8");
        const data = JSON.parse(content);
        data.monthly.forEach((m) => months.add(m.month));
      } catch {
      }
    }
    return Array.from(months).sort();
  }
  /**
   * Set monthly spend limit
   */
  async setMonthlyLimit(month, limit) {
    try {
      const store = this.ensureInitialized();
      const limits = store.get("monthlyLimits");
      limits[month] = limit;
      store.set("monthlyLimits", limits);
      const usage = store.get("usage");
      const monthData = usage.monthly.find((m) => m.month === month);
      if (monthData) {
        monthData.limit = limit;
        store.set("usage", usage);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  /**
   * Get monthly limit
   */
  async getMonthlyLimit(month) {
    try {
      const store = this.ensureInitialized();
      const limits = store.get("monthlyLimits");
      return limits[month];
    } catch {
      return void 0;
    }
  }
  /**
   * Get all monthly limits
   */
  async getAllMonthlyLimits() {
    try {
      const store = this.ensureInitialized();
      return store.get("monthlyLimits");
    } catch {
      return {};
    }
  }
  /**
   * Clean up old data older than specified months
   */
  async cleanupOldData(monthsToKeep = DEFAULT_RETENTION_MONTHS) {
    try {
      const store = this.ensureInitialized();
      const usage = store.get("usage");
      const cutoff = /* @__PURE__ */ new Date();
      cutoff.setMonth(cutoff.getMonth() - monthsToKeep);
      const cutoffStr = this.formatMonth(cutoff);
      const originalCount = usage.monthly.length;
      usage.monthly = usage.monthly.filter((m) => m.month >= cutoffStr);
      usage.lastUpdated = Date.now();
      store.set("usage", usage);
      return { deleted: originalCount - usage.monthly.length };
    } catch (error) {
      return { deleted: 0, error: error.message };
    }
  }
  /**
   * Export usage data to CSV format
   */
  async exportToCSV(workspacePath) {
    try {
      const { usage } = await this.getUsage(void 0, workspacePath);
      if (!usage || usage.monthly.length === 0) {
        return { error: "No usage data available" };
      }
      const headers = ["Date", "Provider", "Model", "Input Tokens", "Output Tokens", "Cost"];
      const rows = [headers.join(",")];
      for (const month of usage.monthly) {
        for (const day of month.days) {
          for (const record of day.records) {
            const row = [
              new Date(record.timestamp).toISOString(),
              record.provider,
              record.model,
              record.inputTokens,
              record.outputTokens,
              record.cost.toFixed(4)
            ];
            rows.push(row.join(","));
          }
        }
      }
      return { csv: rows.join("\n") };
    } catch (error) {
      return { error: error.message };
    }
  }
  /**
   * Get summary statistics
   */
  async getSummary(month, workspacePath) {
    try {
      const { usage } = await this.getUsage(month, workspacePath);
      if (!usage) {
        return { totalCost: 0, totalTokens: 0, requestCount: 0, byModel: {}, byProvider: {} };
      }
      const monthsToProcess = month ? usage.monthly.filter((m) => m.month === month) : usage.monthly;
      let totalCost = 0;
      let totalTokens = 0;
      let requestCount = 0;
      const byModel = {};
      const byProvider = {};
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
        error: error.message
      };
    }
  }
  formatMonth(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
};
var usageStorage = null;
async function getUsageStorage() {
  if (!usageStorage) {
    usageStorage = new UsageStorage();
    await usageStorage.initialize();
  }
  return usageStorage;
}
function resetUsageStorage() {
  usageStorage = null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UsageStorage,
  getUsageStorage,
  resetUsageStorage
});
//# sourceMappingURL=usage-storage.cjs.map