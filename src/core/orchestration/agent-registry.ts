import { AgentRole } from '../agent-types.js';
import type { AgentConfig } from '../agent-types.js';
import type { LLMProvider } from '../../providers/provider-types.js';
import type { ToolRegistration } from '../../tools/tool-types.js';
import type { AgentCapability, AgentSpec, ModelPreference, OrchestrationConfig } from './orchestration-types.js';

/** Read-only tool names (no filesystem writes, no shell execution) */
const READ_ONLY_TOOLS = new Set([
  'Read', 'Glob', 'Grep', 'ListDirectory', 'QueryCodebase',
  'SearchWeb', 'WebFetch', 'TreeView',
]);

/** Research-specific tools */
const RESEARCH_TOOLS = new Set([
  'Read', 'Glob', 'Grep', 'SearchWeb', 'WebFetch', 'QueryCodebase',
]);

/** All 9 specialized agent specifications */
const AGENT_SPECS: AgentSpec[] = [
  {
    capability: 'code_read',
    role: AgentRole.researcher,
    planMode: true,
    temperature: 0.3,
    modelPreference: 'cheap',
    toolFilter: 'read_only',
    systemPromptSuffix: 'You are a code analysis specialist. Read and understand code, find patterns, trace dependencies, and explain implementations. Do NOT modify any files.',
  },
  {
    capability: 'code_write',
    role: AgentRole.coder,
    planMode: false,
    temperature: 0.3,
    modelPreference: 'powerful',
    toolFilter: 'all',
    systemPromptSuffix: 'You are an expert coder. Implement features, write clean code, and follow existing patterns in the codebase. Read files before modifying them.',
  },
  {
    capability: 'code_review',
    role: AgentRole.reviewer,
    planMode: true,
    temperature: 0.2,
    modelPreference: 'powerful',
    toolFilter: 'read_only',
    systemPromptSuffix: 'You are a code reviewer. Identify bugs, security issues, performance problems, and style violations. Provide specific, actionable feedback. Do NOT modify files.',
  },
  {
    capability: 'testing',
    role: AgentRole.tester,
    planMode: false,
    temperature: 0.2,
    modelPreference: 'cheap',
    toolFilter: 'all',
    systemPromptSuffix: 'You are a testing specialist. Write and run tests, ensure coverage, and verify correctness. Use the Bash tool to execute test suites.',
  },
  {
    capability: 'debugging',
    role: AgentRole.debugger,
    planMode: false,
    temperature: 0.2,
    modelPreference: 'powerful',
    toolFilter: 'all',
    systemPromptSuffix: 'You are a debugging expert. Investigate errors, trace root causes, and apply fixes. Use logs, stack traces, and the debugger tool to diagnose issues.',
  },
  {
    capability: 'architecture',
    role: AgentRole.architect,
    planMode: true,
    temperature: 0.5,
    modelPreference: 'powerful',
    toolFilter: 'read_only',
    systemPromptSuffix: 'You are a software architect. Analyze project structure, design solutions, and plan implementations. Focus on patterns, dependencies, and trade-offs. Do NOT modify files.',
  },
  {
    capability: 'research',
    role: AgentRole.researcher,
    planMode: true,
    temperature: 0.3,
    modelPreference: 'cheap',
    toolFilter: 'research_only',
    systemPromptSuffix: 'You are a research specialist. Search the web, read documentation, and gather information. Provide concise summaries of findings.',
  },
  {
    capability: 'documentation',
    role: AgentRole.documenter,
    planMode: false,
    temperature: 0.5,
    modelPreference: 'cheap',
    toolFilter: 'all',
    systemPromptSuffix: 'You are a documentation specialist. Write clear docstrings, README sections, and inline comments. Follow existing documentation patterns.',
  },
  {
    capability: 'refactoring',
    role: AgentRole.refactorer,
    planMode: false,
    temperature: 0.2,
    modelPreference: 'powerful',
    toolFilter: 'all',
    systemPromptSuffix: 'You are a refactoring expert. Improve code structure, reduce duplication, and enhance readability while preserving behavior. Always read before modifying.',
  },
];

/**
 * Registry of specialized agent types.
 * Maps capabilities to agent specs and builds concrete AgentConfigs.
 */
export class AgentRegistry {
  private specMap = new Map<AgentCapability, AgentSpec>();

  constructor() {
    for (const spec of AGENT_SPECS) {
      this.specMap.set(spec.capability, spec);
    }
  }

  getSpec(capability: AgentCapability): AgentSpec | undefined {
    return this.specMap.get(capability);
  }

  getAllSpecs(): AgentSpec[] {
    return AGENT_SPECS;
  }

  /**
   * Build a concrete AgentConfig for a given capability.
   */
  buildAgentConfig(
    capability: AgentCapability,
    baseProvider: LLMProvider,
    baseModel: string,
    baseSystemPrompt: string,
    allTools: ToolRegistration[],
    orchestrationConfig: OrchestrationConfig,
  ): AgentConfig | null {
    const spec = this.specMap.get(capability);
    if (!spec) return null;

    const overrides = orchestrationConfig.agentOverrides[capability] || {};

    // Filter tools based on spec
    const tools = this.filterTools(allTools, spec.toolFilter);

    // Build system prompt
    const systemPrompt = `${baseSystemPrompt}\n\n## Your Role\n${spec.systemPromptSuffix}`;

    return {
      agentRole: spec.role,
      provider: baseProvider,
      model: overrides.preferredModel || baseModel,
      systemPrompt,
      tools,
      maxTurns: overrides.maxTurns ?? 15,
      temperature: overrides.temperature ?? spec.temperature,
      maxContextTokens: 50000,
      isSubAgent: true,
      planMode: spec.planMode,
    };
  }

  private filterTools(tools: ToolRegistration[], filter: 'all' | 'read_only' | 'research_only'): ToolRegistration[] {
    if (filter === 'all') return tools;

    const allowedSet = filter === 'read_only' ? READ_ONLY_TOOLS : RESEARCH_TOOLS;
    return tools.filter(t => allowedSet.has(t.tool.name));
  }
}
