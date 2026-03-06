import type { LLMProvider } from '../../providers/provider-types.js';
import type { TaskAnalysis, AgentCapability, OrchestrationConfig } from './orchestration-types.js';

/** Patterns that indicate a simple, single-agent task */
const SIMPLE_PATTERNS = [
  /^(explain|what is|what does|describe|show me|read|find|search|list)\b/i,
  /^(fix the typo|rename|change .+ to)/i,
  /^(run|execute|start|build|test)\s+\S+$/i,
  /\b(this file|this function|this class)\b/i,
];

/** Patterns that indicate a complex, multi-agent task */
const COMPLEX_PATTERNS = [
  /(?:^|\n)\s*\d+[\.\)]/m,                         // numbered steps
  /\b(entire codebase|all files|comprehensive|full audit)\b/i,
  /\b(refactor|migrate|rewrite)\b.*\b(and|then|also)\b/i,
  /\b(implement|create|build|add)\b.*\b(and|then|also)\b.*\b(implement|create|build|add|test|document)\b/i,
];

/** Keywords mapped to capabilities */
const CAPABILITY_KEYWORDS: Record<string, AgentCapability[]> = {
  'read|explain|understand|analyze|find|search|explore': ['code_read'],
  'write|implement|create|add|build|code': ['code_write'],
  'review|audit|check|inspect|quality': ['code_review'],
  'test|spec|coverage|unit test|integration test': ['testing'],
  'debug|fix|bug|error|issue|crash': ['debugging'],
  'architect|design|plan|structure|organize': ['architecture'],
  'research|look up|search web|investigate|compare': ['research'],
  'document|docstring|readme|jsdoc|comment': ['documentation'],
  'refactor|clean up|restructure|rename|extract|simplify': ['refactoring'],
};

/**
 * Analyzes user prompts to determine whether orchestration is needed.
 * Uses a hybrid approach: fast regex patterns first, LLM fallback for ambiguous cases.
 */
export class TaskAnalyzer {
  constructor(
    private provider: LLMProvider,
    private model: string,
    private config: OrchestrationConfig,
  ) {}

  async analyze(prompt: string): Promise<TaskAnalysis> {
    // Force overrides from config
    if (this.config.forceSingleAgent) {
      return this.buildSimpleResult(prompt);
    }
    if (this.config.forceOrchestrate) {
      return this.buildComplexResult(prompt);
    }

    // Fast path: pattern matching
    const fastResult = this.fastAnalyze(prompt);
    if (fastResult) return fastResult;

    // LLM path for ambiguous cases
    return this.llmAnalyze(prompt);
  }

  private fastAnalyze(prompt: string): TaskAnalysis | null {
    const trimmed = prompt.trim();

    // Very short prompts are almost always simple
    if (trimmed.length < 80 && SIMPLE_PATTERNS.some(p => p.test(trimmed))) {
      return this.buildSimpleResult(prompt);
    }

    // Multi-step or comprehensive tasks
    if (trimmed.length > 600 && COMPLEX_PATTERNS.some(p => p.test(trimmed))) {
      return this.buildComplexResult(prompt);
    }

    // Count distinct action verbs to detect multi-task prompts
    const actionVerbs = ['implement', 'create', 'write', 'add', 'build', 'test',
      'refactor', 'document', 'review', 'fix', 'debug', 'deploy', 'migrate'];
    const foundVerbs = new Set<string>();
    for (const verb of actionVerbs) {
      if (new RegExp(`\\b${verb}\\b`, 'i').test(trimmed)) {
        foundVerbs.add(verb);
      }
    }
    if (foundVerbs.size >= 3) {
      return this.buildComplexResult(prompt);
    }

    return null; // ambiguous — fall through to LLM
  }

  private async llmAnalyze(prompt: string): Promise<TaskAnalysis> {
    const analysisPrompt = `Analyze this user request and determine if it requires multiple specialized agents or a single agent.

User request:
"""
${prompt.substring(0, 2000)}
"""

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "complexity": "simple" | "moderate" | "complex",
  "shouldOrchestrate": boolean,
  "capabilities": string[],
  "estimatedAgentCount": number,
  "reasoning": "brief explanation"
}

capabilities must be from: code_read, code_write, code_review, testing, debugging, architecture, research, documentation, refactoring

Rules:
- shouldOrchestrate = false for single-focus tasks (one file, one action, one scope)
- shouldOrchestrate = true when task needs 2+ distinct agent types working on different scopes
- estimatedAgentCount should be between 1-${this.config.maxTotalAgents}`;

    try {
      let responseText = '';
      for await (const delta of this.provider.streamComplete({
        messages: [{
          id: crypto.randomUUID(),
          role: 'user',
          content: analysisPrompt,
          timestamp: Date.now(),
        }],
        model: this.config.analysisModel || this.model,
        systemPrompt: 'You are a task analysis system. Output only valid JSON.',
        temperature: 0.1,
        maxTokens: 500,
        stream: true,
      })) {
        if (delta.type === 'text' && delta.text) {
          responseText += delta.text;
        }
      }

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          complexity: parsed.complexity || 'moderate',
          shouldOrchestrate: Boolean(parsed.shouldOrchestrate),
          capabilities: (parsed.capabilities || []).filter((c: string) => this.isValidCapability(c)),
          estimatedAgentCount: Math.min(parsed.estimatedAgentCount || 1, this.config.maxTotalAgents),
          reasoning: parsed.reasoning || '',
        };
      }
    } catch {
      // LLM analysis failed — default to simple
    }

    return this.buildSimpleResult(prompt);
  }

  private buildSimpleResult(prompt: string): TaskAnalysis {
    return {
      complexity: 'simple',
      shouldOrchestrate: false,
      capabilities: this.extractCapabilities(prompt),
      estimatedAgentCount: 1,
      reasoning: 'Fast path: single-agent task',
    };
  }

  private buildComplexResult(prompt: string): TaskAnalysis {
    const capabilities = this.extractCapabilities(prompt);
    return {
      complexity: 'complex',
      shouldOrchestrate: true,
      capabilities: capabilities.length > 0 ? capabilities : ['code_read', 'code_write'],
      estimatedAgentCount: Math.min(capabilities.length || 2, this.config.maxTotalAgents),
      reasoning: 'Fast path: multi-agent task detected',
    };
  }

  private extractCapabilities(prompt: string): AgentCapability[] {
    const found = new Set<AgentCapability>();
    for (const [pattern, caps] of Object.entries(CAPABILITY_KEYWORDS)) {
      const regex = new RegExp(`\\b(${pattern})\\b`, 'i');
      if (regex.test(prompt)) {
        for (const cap of caps) found.add(cap);
      }
    }
    return Array.from(found);
  }

  private isValidCapability(cap: string): cap is AgentCapability {
    return [
      'code_read', 'code_write', 'code_review', 'testing', 'debugging',
      'architecture', 'research', 'documentation', 'refactoring',
    ].includes(cap);
  }
}
