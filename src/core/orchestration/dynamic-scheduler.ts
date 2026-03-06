import PQueue from 'p-queue';
import type { AgentEvent } from '../agent-types.js';
import { AgentImpl } from '../agent.js';
import type { ToolRunner } from '../../tools/tool-runner.js';
import type { CostTracker } from '../cost-tracker.js';
import { getTextContent } from '../message-types.js';
import type { TaskGraph, SubTask, AgentResult, OrchestrationConfig } from './orchestration-types.js';
import type { AgentRegistry } from './agent-registry.js';
import type { LLMProvider } from '../../providers/provider-types.js';
import type { ToolRegistration } from '../../tools/tool-types.js';

/**
 * Executes a TaskGraph by scheduling agents in topological order
 * with parallel execution via p-queue.
 */
export class DynamicScheduler {
  /** Results from the last execution, accessible after the generator completes */
  readonly completedResults: AgentResult[] = [];

  constructor(
    private registry: AgentRegistry,
    private provider: LLMProvider,
    private model: string,
    private baseSystemPrompt: string,
    private tools: ToolRegistration[],
    private toolRunner: ToolRunner,
    private costTracker: CostTracker,
    private config: OrchestrationConfig,
  ) {}

  async *execute(graph: TaskGraph): AsyncGenerator<AgentEvent> {
    this.completedResults.length = 0;
    const results = new Map<string, AgentResult>();
    const taskMap = new Map(graph.tasks.map(t => [t.id, t]));
    const completed = new Set<string>();
    const queue = new PQueue({ concurrency: this.config.maxConcurrentAgents });
    let totalCost = 0;
    const budgetExceeded = { value: false };

    // Topological sort to determine execution order
    const sorted = this.topologicalSort(graph.tasks);

    // Event channel: agents push events here, we yield them
    const eventQueue: AgentEvent[] = [];
    let resolveWait: (() => void) | null = null;

    const pushEvent = (event: AgentEvent) => {
      eventQueue.push(event);
      if (resolveWait) {
        resolveWait();
        resolveWait = null;
      }
    };

    const waitForEvent = (): Promise<void> => {
      if (eventQueue.length > 0) return Promise.resolve();
      return new Promise<void>(r => { resolveWait = r; });
    };

    // Track pending task count
    let pendingTasks = sorted.length;

    // Process tasks
    const scheduleReady = () => {
      for (const task of sorted) {
        if (completed.has(task.id)) continue;
        if (budgetExceeded.value) continue;

        // Check if all dependencies are resolved
        const depsResolved = task.dependencies.every(d => completed.has(d));
        if (!depsResolved) continue;

        // Skip if already queued (check by marking)
        if ((task as any)._queued) continue;
        (task as any)._queued = true;

        queue.add(async () => {
          const result = await this.executeTask(task, results, graph.originalPrompt, pushEvent);
          results.set(task.id, result);
          completed.add(task.id);
          pendingTasks--;

          // Check cost budget
          totalCost = this.costTracker.totalCost;
          if (this.config.costBudget && totalCost > this.config.costBudget) {
            budgetExceeded.value = true;
            pushEvent({
              type: 'error',
              error: new Error(`Orchestration cost budget exceeded: $${totalCost.toFixed(4)} > $${this.config.costBudget}`),
            });
          }

          // Schedule newly unblocked tasks
          scheduleReady();
        });
      }
    };

    scheduleReady();

    // Yield events as they arrive
    while (pendingTasks > 0 || eventQueue.length > 0) {
      await waitForEvent();
      while (eventQueue.length > 0) {
        yield eventQueue.shift()!;
      }

      // If queue is idle and nothing is pending, we're done
      if (queue.size === 0 && queue.pending === 0 && pendingTasks <= 0) break;
    }

    // Drain remaining events
    while (eventQueue.length > 0) {
      yield eventQueue.shift()!;
    }

    // Store completed results for external access
    for (const task of graph.tasks) {
      const result = results.get(task.id);
      if (result) this.completedResults.push(result);
    }
  }

  getResults(graph: TaskGraph, results: Map<string, AgentResult>): AgentResult[] {
    return graph.tasks.map(t => results.get(t.id)!).filter(Boolean);
  }

  private async executeTask(
    task: SubTask,
    completedResults: Map<string, AgentResult>,
    originalPrompt: string,
    pushEvent: (event: AgentEvent) => void,
  ): Promise<AgentResult> {
    const startTime = Date.now();

    pushEvent({
      type: 'orchestration_task_start',
      taskId: task.id,
      description: task.description,
      capability: task.capability,
    });

    // Build context from dependency results
    let dependencyContext = '';
    for (const depId of task.dependencies) {
      const depResult = completedResults.get(depId);
      if (depResult) {
        const truncated = depResult.output.length > 3000
          ? depResult.output.substring(0, 3000) + '\n[...truncated]'
          : depResult.output;
        dependencyContext += `\n\n## Result from ${depResult.capability} agent (${depId}):\n${truncated}`;
      }
    }

    // Build agent config
    const agentConfig = this.registry.buildAgentConfig(
      task.capability,
      this.provider,
      this.model,
      this.baseSystemPrompt,
      this.tools,
      this.config,
    );

    if (!agentConfig) {
      return {
        taskId: task.id,
        capability: task.capability,
        output: `No agent spec found for capability: ${task.capability}`,
        success: false,
        error: 'Unknown capability',
        tokenUsage: { inputTokens: 0, outputTokens: 0 },
        durationMs: Date.now() - startTime,
      };
    }

    // Create the agent
    const agent = new AgentImpl(agentConfig, this.toolRunner, this.costTracker);

    // Build the task prompt
    const taskPrompt = [
      `## Original User Request\n${originalPrompt}`,
      `## Your Specific Task\n${task.description}`,
      dependencyContext ? `## Context from Previous Agents${dependencyContext}` : '',
    ].filter(Boolean).join('\n\n');

    // Execute the agent and collect output
    let output = '';
    const tokenUsage = { inputTokens: 0, outputTokens: 0 };

    try {
      for await (const event of agent.run(taskPrompt)) {
        // Forward relevant events
        if (event.type === 'stream_delta' || event.type === 'tool_call_start' ||
            event.type === 'tool_call_end' || event.type === 'error') {
          pushEvent(event);
        }

        if (event.type === 'turn_complete') {
          output = getTextContent(event.message);
          pushEvent(event);
        }

        if (event.type === 'cost_update') {
          pushEvent(event);
        }
      }

      const durationMs = Date.now() - startTime;
      pushEvent({
        type: 'orchestration_task_end',
        taskId: task.id,
        success: true,
        durationMs,
      });

      return {
        taskId: task.id,
        capability: task.capability,
        output: output || '(no output)',
        success: true,
        tokenUsage,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      pushEvent({
        type: 'orchestration_task_end',
        taskId: task.id,
        success: false,
        durationMs,
      });

      return {
        taskId: task.id,
        capability: task.capability,
        output: '',
        success: false,
        error: (error as Error).message,
        tokenUsage,
        durationMs,
      };
    }
  }

  private topologicalSort(tasks: SubTask[]): SubTask[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const visited = new Set<string>();
    const result: SubTask[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const task = taskMap.get(id);
      if (!task) return;
      for (const dep of task.dependencies) {
        visit(dep);
      }
      result.push(task);
    };

    for (const task of tasks) {
      visit(task.id);
    }

    return result;
  }
}
