import type { LLMProvider } from '../../providers/provider-types.js';
import type { TaskAnalysis, SubTask, TaskGraph, AgentCapability, OrchestrationConfig } from './orchestration-types.js';

const VALID_CAPABILITIES: AgentCapability[] = [
  'code_read', 'code_write', 'code_review', 'testing', 'debugging',
  'architecture', 'research', 'documentation', 'refactoring',
];

/**
 * Decomposes a complex prompt into a DAG of sub-tasks using LLM analysis.
 * Validates the resulting graph for cycles and capability correctness.
 */
export class TaskDecomposer {
  constructor(
    private provider: LLMProvider,
    private model: string,
    private config: OrchestrationConfig,
  ) {}

  async decompose(prompt: string, analysis: TaskAnalysis): Promise<TaskGraph> {
    const decompositionPrompt = `Decompose this task into sub-tasks for specialized agents.

User request:
"""
${prompt.substring(0, 3000)}
"""

Analysis: ${JSON.stringify(analysis)}

Available agent capabilities: ${VALID_CAPABILITIES.join(', ')}

Rules:
- Maximum ${this.config.maxTotalAgents} tasks
- Each task gets ONE capability
- Use dependencies to order tasks (task B depends on task A → A runs first)
- Tasks without dependencies can run in parallel
- Keep tasks focused: one clear objective each
- Always include a code_read task first if the codebase needs to be understood

Respond with ONLY a JSON array (no markdown, no explanation):
[
  { "id": "t1", "description": "...", "capability": "code_read", "dependencies": [] },
  { "id": "t2", "description": "...", "capability": "code_write", "dependencies": ["t1"] }
]`;

    try {
      let responseText = '';
      for await (const delta of this.provider.streamComplete({
        messages: [{
          id: crypto.randomUUID(),
          role: 'user',
          content: decompositionPrompt,
          timestamp: Date.now(),
        }],
        model: this.config.analysisModel || this.model,
        systemPrompt: 'You are a task decomposition system. Output only valid JSON arrays.',
        temperature: 0.2,
        maxTokens: 2000,
        stream: true,
      })) {
        if (delta.type === 'text' && delta.text) {
          responseText += delta.text;
        }
      }

      // Extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as any[];
        const tasks = this.validateAndClean(parsed);

        if (tasks.length > 0) {
          return { tasks, originalPrompt: prompt };
        }
      }
    } catch {
      // LLM decomposition failed — use fallback
    }

    // Fallback: create a simple graph from the analysis capabilities
    return this.fallbackDecompose(prompt, analysis);
  }

  private validateAndClean(raw: any[]): SubTask[] {
    const tasks: SubTask[] = [];
    const validIds = new Set<string>();

    for (const item of raw) {
      if (!item.id || !item.description || !item.capability) continue;
      if (!VALID_CAPABILITIES.includes(item.capability)) continue;
      if (tasks.length >= this.config.maxTotalAgents) break;

      validIds.add(item.id);
      tasks.push({
        id: item.id,
        description: String(item.description),
        capability: item.capability as AgentCapability,
        dependencies: Array.isArray(item.dependencies) ? item.dependencies : [],
      });
    }

    // Remove invalid dependency references
    for (const task of tasks) {
      task.dependencies = task.dependencies.filter(d => validIds.has(d) && d !== task.id);
    }

    // Check for cycles
    if (this.hasCycle(tasks)) {
      // Break cycles by removing all dependencies
      for (const task of tasks) {
        task.dependencies = [];
      }
    }

    return tasks;
  }

  private hasCycle(tasks: SubTask[]): boolean {
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const dfs = (id: string): boolean => {
      if (inStack.has(id)) return true;
      if (visited.has(id)) return false;

      visited.add(id);
      inStack.add(id);

      const task = taskMap.get(id);
      if (task) {
        for (const dep of task.dependencies) {
          if (dfs(dep)) return true;
        }
      }

      inStack.delete(id);
      return false;
    };

    for (const task of tasks) {
      if (dfs(task.id)) return true;
    }
    return false;
  }

  private fallbackDecompose(prompt: string, analysis: TaskAnalysis): TaskGraph {
    const tasks: SubTask[] = [];
    const capabilities = analysis.capabilities.length > 0
      ? analysis.capabilities
      : ['code_read', 'code_write'] as AgentCapability[];

    // Ensure we have a read step first if code_write or refactoring is involved
    const needsRead = capabilities.some(c => ['code_write', 'refactoring', 'code_review'].includes(c));
    let lastReadId: string | undefined;

    if (needsRead && !capabilities.includes('code_read')) {
      const id = 't0';
      tasks.push({
        id,
        description: `Analyze the codebase to understand: ${prompt.substring(0, 200)}`,
        capability: 'code_read',
        dependencies: [],
      });
      lastReadId = id;
    }

    for (let i = 0; i < capabilities.length && tasks.length < this.config.maxTotalAgents; i++) {
      const cap = capabilities[i];
      const id = `t${tasks.length + 1}`;
      const deps: string[] = [];

      // Write/refactor/review tasks depend on read tasks
      if (lastReadId && ['code_write', 'refactoring', 'code_review'].includes(cap)) {
        deps.push(lastReadId);
      }

      if (cap === 'code_read') lastReadId = id;

      tasks.push({
        id,
        description: `${cap}: ${prompt.substring(0, 200)}`,
        capability: cap,
        dependencies: deps,
      });
    }

    return { tasks, originalPrompt: prompt };
  }
}
