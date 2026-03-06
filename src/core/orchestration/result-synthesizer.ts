import type { LLMProvider } from '../../providers/provider-types.js';
import type { AgentResult } from './orchestration-types.js';

/**
 * Synthesizes results from multiple agents into a unified summary.
 * Uses LLM to combine outputs intelligently.
 */
export class ResultSynthesizer {
  constructor(
    private provider: LLMProvider,
    private model: string,
  ) {}

  async synthesize(results: AgentResult[], originalPrompt: string): Promise<string> {
    // Single result: return it directly
    if (results.length === 1) {
      return results[0].output;
    }

    // Filter to successful results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length === 0) {
      return `All ${results.length} agents failed.\n\nErrors:\n${failed.map(r => `- ${r.capability}: ${r.error}`).join('\n')}`;
    }

    // Build context for synthesis
    const resultSummaries = successful.map(r => {
      const truncated = r.output.length > 4000
        ? r.output.substring(0, 4000) + '\n[...truncated]'
        : r.output;
      return `### ${r.capability} agent (${r.taskId}) — ${r.durationMs}ms\n${truncated}`;
    }).join('\n\n');

    const synthesisPrompt = `You coordinated multiple specialized agents to handle this user request:

**Original Request:**
${originalPrompt.substring(0, 1000)}

**Agent Results:**
${resultSummaries}

${failed.length > 0 ? `**Failed Agents:**\n${failed.map(r => `- ${r.capability}: ${r.error}`).join('\n')}\n` : ''}

Synthesize these results into a clear, unified response for the user. Include:
1. What was accomplished
2. Key findings or changes made
3. Any issues or failures
4. Next steps if applicable

Be concise and actionable.`;

    try {
      let responseText = '';
      for await (const delta of this.provider.streamComplete({
        messages: [{
          id: crypto.randomUUID(),
          role: 'user',
          content: synthesisPrompt,
          timestamp: Date.now(),
        }],
        model: this.model,
        systemPrompt: 'You are a synthesis agent that combines results from multiple specialized agents into a clear summary.',
        temperature: 0.3,
        maxTokens: 2000,
        stream: true,
      })) {
        if (delta.type === 'text' && delta.text) {
          responseText += delta.text;
        }
      }

      if (responseText.length > 50) {
        return responseText;
      }
    } catch {
      // LLM synthesis failed — fall back to concatenation
    }

    // Fallback: simple concatenation
    return this.fallbackSynthesize(successful, failed);
  }

  private fallbackSynthesize(successful: AgentResult[], failed: AgentResult[]): string {
    const parts: string[] = ['## Orchestration Results\n'];

    for (const result of successful) {
      parts.push(`### ${result.capability} (${result.durationMs}ms)`);
      parts.push(result.output.substring(0, 2000));
      parts.push('');
    }

    if (failed.length > 0) {
      parts.push('### Failures');
      for (const result of failed) {
        parts.push(`- ${result.capability}: ${result.error}`);
      }
    }

    return parts.join('\n');
  }
}
