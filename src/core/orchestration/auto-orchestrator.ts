import type { Agent, AgentEvent } from '../agent-types.js';
import type { LLMProvider } from '../../providers/provider-types.js';
import type { ToolRegistration } from '../../tools/tool-types.js';
import type { ToolRunner } from '../../tools/tool-runner.js';
import type { CostTracker } from '../cost-tracker.js';
import type { OrchestrationConfig } from './orchestration-types.js';
import { TaskAnalyzer } from './task-analyzer.js';
import { TaskDecomposer } from './task-decomposer.js';
import { AgentRegistry } from './agent-registry.js';
import { DynamicScheduler } from './dynamic-scheduler.js';
import { ResultSynthesizer } from './result-synthesizer.js';

/**
 * Main entry point for automatic agent orchestration.
 *
 * For simple tasks: passes through directly to the primary agent (zero overhead).
 * For complex tasks: analyzes, decomposes, spawns specialized agents, and synthesizes.
 */
export class AutoOrchestrator {
  private analyzer: TaskAnalyzer;
  private decomposer: TaskDecomposer;
  private registry: AgentRegistry;
  private synthesizer: ResultSynthesizer;

  constructor(
    private provider: LLMProvider,
    private model: string,
    private baseSystemPrompt: string,
    private tools: ToolRegistration[],
    private toolRunner: ToolRunner,
    private costTracker: CostTracker,
    private config: OrchestrationConfig,
  ) {
    this.analyzer = new TaskAnalyzer(provider, model, config);
    this.decomposer = new TaskDecomposer(provider, model, config);
    this.registry = new AgentRegistry();
    this.synthesizer = new ResultSynthesizer(provider, model);
  }

  updateModel(provider: LLMProvider, model: string): void {
    this.provider = provider;
    this.model = model;
    this.analyzer = new TaskAnalyzer(provider, model, this.config);
    this.decomposer = new TaskDecomposer(provider, model, this.config);
    this.synthesizer = new ResultSynthesizer(provider, model);
  }

  /**
   * Execute a user prompt, automatically deciding between single and multi-agent.
   * Yields AgentEvents for the UI to consume.
   */
  async *execute(prompt: string, agent: Agent): AsyncGenerator<AgentEvent> {
    if (!this.config.enabled) {
      // Orchestration disabled — passthrough
      yield* agent.run(prompt);
      return;
    }

    // Step 1: Analyze the task
    const analysis = await this.analyzer.analyze(prompt);

    yield {
      type: 'orchestration_analysis',
      analysis,
    };

    // Step 2: If simple, passthrough to the primary agent
    if (!analysis.shouldOrchestrate) {
      yield* agent.run(prompt);
      return;
    }

    // Step 3: Decompose into sub-tasks
    const graph = await this.decomposer.decompose(prompt, analysis);

    if (graph.tasks.length <= 1) {
      // Decomposition yielded single task — just use the primary agent
      yield* agent.run(prompt);
      return;
    }

    // Step 4: Execute via dynamic scheduler
    const scheduler = new DynamicScheduler(
      this.registry,
      this.provider,
      this.model,
      this.baseSystemPrompt,
      this.tools,
      this.toolRunner,
      this.costTracker,
      this.config,
    );

    for await (const event of scheduler.execute(graph)) {
      yield event;
    }

    // Step 5: Synthesize results
    const results = scheduler.completedResults;
    let summary: string;

    if (results.length > 0) {
      summary = await this.synthesizer.synthesize(results, prompt);
    } else {
      summary = 'Orchestration completed but no agent produced results.';
    }

    yield {
      type: 'orchestration_synthesis',
      summary,
    };

    yield {
      type: 'orchestration_complete',
      summary: `Orchestration complete: ${graph.tasks.length} agents executed (${results.filter(r => r.success).length} succeeded, ${results.filter(r => !r.success).length} failed)`,
    };
  }
}
