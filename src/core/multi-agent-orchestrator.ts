import type { AgentConfig, AgentEvent } from './agent-types.js';
import { AgentRole } from './agent-types.js';
import { AgentImpl } from './agent.js';
import type { ToolRunner } from '../tools/tool-runner.js';
import type { CostTracker } from './cost-tracker.js';
import { getTextContent } from './message-types.js';

export interface OrchestratorConfig {
  baseConfig: AgentConfig;
  roles?: AgentRole[];
  maxReviewIterations?: number;
}

export class MultiAgentOrchestrator {
  private runner: ToolRunner;
  private tracker: CostTracker;
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig, runner: ToolRunner, tracker: CostTracker) {
    this.config = config;
    this.runner = runner;
    this.tracker = tracker;
  }

  async *orchestrate(task: string): AsyncIterable<AgentEvent> {
    const roles = this.config.roles || [AgentRole.planner, AgentRole.coder, AgentRole.reviewer];
    const maxReviewIterations = this.config.maxReviewIterations || 2;

    let plan = '';
    let implementation = '';

    // Phase 1: Planning
    if (roles.includes(AgentRole.planner)) {
      yield {
        type: 'agent_phase_start' as const,
        role: AgentRole.planner,
        description: 'Creating implementation plan',
      } as AgentEvent;

      const plannerConfig: AgentConfig = {
        ...this.config.baseConfig,
        agentRole: AgentRole.planner,
        systemPrompt: `You are a planning agent. Your job is to analyze the task and create a clear, step-by-step implementation plan.

Guidelines:
- Break down the task into numbered, actionable steps
- Identify which files need to be created or modified
- Consider edge cases and potential issues
- Keep the plan concise but thorough

Do NOT implement anything - only plan.`,
        planMode: true,
        isSubAgent: true,
      };

      const planner = new AgentImpl(plannerConfig, this.runner, this.tracker);
      for await (const event of planner.run(task)) {
        yield event;
        if (event.type === 'turn_complete') {
          plan = getTextContent(event.message);
        }
      }

      yield {
        type: 'agent_phase_end' as const,
        role: AgentRole.planner,
      } as AgentEvent;
    }

    // Phase 2: Coding
    if (roles.includes(AgentRole.coder)) {
      yield {
        type: 'agent_phase_start' as const,
        role: AgentRole.coder,
        description: 'Implementing the plan',
      } as AgentEvent;

      const coderPrompt = plan
        ? `Implement the following plan step by step:\n\n${plan}`
        : task;

      const coderConfig: AgentConfig = {
        ...this.config.baseConfig,
        agentRole: AgentRole.coder,
        systemPrompt: `You are a coding agent. Your job is to implement code changes using the available tools.

Guidelines:
- Follow the plan precisely
- Read files before modifying them
- Write clean, well-structured code
- Test changes when possible`,
        planMode: false,
        isSubAgent: true,
      };

      const coder = new AgentImpl(coderConfig, this.runner, this.tracker);
      for await (const event of coder.run(coderPrompt)) {
        yield event;
        if (event.type === 'turn_complete') {
          implementation = getTextContent(event.message);
        }
      }

      yield {
        type: 'agent_phase_end' as const,
        role: AgentRole.coder,
      } as AgentEvent;
    }

    // Phase 3: Review (optional loop)
    if (roles.includes(AgentRole.reviewer) && implementation) {
      let reviewIteration = 0;
      let needsRevision = true;

      while (needsRevision && reviewIteration < maxReviewIterations) {
        reviewIteration++;

        yield {
          type: 'agent_phase_start' as const,
          role: AgentRole.reviewer,
          description: `Code review (iteration ${reviewIteration})`,
        } as AgentEvent;

        const reviewerConfig: AgentConfig = {
          ...this.config.baseConfig,
          agentRole: AgentRole.reviewer,
          systemPrompt: `You are a code review agent. Review the implementation for:
- Correctness and bug potential
- Code style and best practices
- Edge cases and error handling
- Security issues

If the code is acceptable, respond with "APPROVED" at the start of your response.
If changes are needed, describe them clearly and specifically.`,
          planMode: true,
          isSubAgent: true,
        };

        const reviewer = new AgentImpl(reviewerConfig, this.runner, this.tracker);
        let reviewResult = '';
        for await (const event of reviewer.run(
          `Review this implementation:\n\n${implementation}\n\nOriginal task: ${task}`
        )) {
          yield event;
          if (event.type === 'turn_complete') {
            reviewResult = getTextContent(event.message);
          }
        }

        yield {
          type: 'agent_phase_end' as const,
          role: AgentRole.reviewer,
        } as AgentEvent;

        needsRevision = !reviewResult.toUpperCase().startsWith('APPROVED');

        // If revision needed and we have iterations left, re-run coder
        if (needsRevision && reviewIteration < maxReviewIterations) {
          yield {
            type: 'agent_phase_start' as const,
            role: AgentRole.coder,
            description: `Applying review feedback (iteration ${reviewIteration})`,
          } as AgentEvent;

          const fixerConfig: AgentConfig = {
            ...this.config.baseConfig,
            agentRole: AgentRole.coder,
            systemPrompt: `You are a coding agent. Apply the review feedback to fix the implementation.
Only make the changes requested in the review. Do not refactor beyond what's asked.`,
            planMode: false,
            isSubAgent: true,
          };

          const fixer = new AgentImpl(fixerConfig, this.runner, this.tracker);
          for await (const event of fixer.run(
            `Apply this review feedback:\n\n${reviewResult}\n\nTo the implementation:\n\n${implementation}`
          )) {
            yield event;
            if (event.type === 'turn_complete') {
              implementation = getTextContent(event.message);
            }
          }

          yield {
            type: 'agent_phase_end' as const,
            role: AgentRole.coder,
          } as AgentEvent;
        }
      }
    }

    yield {
      type: 'orchestration_complete' as const,
      summary: `Orchestration complete. Phases: ${roles.join(' → ')}`,
    } as AgentEvent;
  }
}
