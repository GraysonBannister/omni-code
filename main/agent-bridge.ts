// Agent Bridge - Wraps the omni-code Agent for Electron IPC
import { BrowserWindow } from 'electron';

// Import types from the core
// Note: These will be resolved at runtime by the built dist-electron files
type AgentEvent =
  | { type: 'stream_delta'; delta: { type: 'text'; text?: string } }
  | { type: 'turn_complete'; message: unknown }
  | { type: 'tool_call_start'; toolName: string; toolId: string; input: Record<string, unknown> }
  | { type: 'tool_call_end'; toolName: string; toolId: string; result: { content: string; isError?: boolean } }
  | { type: 'cost_update'; totalCost: number; turnCost: number }
  | { type: 'error'; error: { message: string } }
  | { type: 'orchestration_task_start'; taskId: string; capability: string; description: string }
  | { type: 'orchestration_task_end'; taskId: string; success: boolean; durationMs: number }
  | { type: 'orchestration_complete'; summary: string };

interface AgentConfig {
  provider: {
    name: string;
    displayName: string;
    streamComplete: (request: unknown) => AsyncGenerator<unknown>;
    countTokens: (messages: unknown[], model: string) => Promise<number>;
    getModelInfo: (model: string) => { capabilities: { extendedThinking: boolean } } | null;
  };
  model: string;
  systemPrompt: string;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: unknown;
    enabled: boolean;
    tool: {
      name: string;
      description: string;
      availableInPlanMode: boolean;
    };
  }>;
  temperature?: number;
  maxContextTokens?: number;
  planMode?: boolean;
  thinking?: { enabled: boolean; budgetTokens: number };
}

interface UnifiedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | unknown[];
  timestamp: number;
  metadata?: {
    model?: string;
    provider?: string;
    inputTokens?: number;
    outputTokens?: number;
    stopReason?: string;
  };
}

// Agent Bridge class that wraps the omni-code Agent for Electron
export class AgentBridge {
  private agent: {
    id: string;
    config: AgentConfig;
    messages: UnifiedMessage[];
    run: (userMessage: string) => AsyncGenerator<AgentEvent>;
    updateConfig: (updates: Partial<AgentConfig>) => void;
    clearMessages: () => void;
  } | null = null;

  private eventListeners: Set<(event: AgentEvent) => void> = new Set();
  private isRunning = false;
  private abortController: AbortController | null = null;

  // Initialize the bridge with core components
  async initialize(agent: AgentBridge['agent']): Promise<void> {
    this.agent = agent;
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.agent || this.isRunning) return;

    this.isRunning = true;
    this.abortController = new AbortController();

    try {
      for await (const event of this.agent.run(message)) {
        // Check if aborted
        if (this.abortController.signal.aborted) {
          break;
        }

        // Emit event to all windows
        this.emitEvent(event as AgentEvent);

        // Handle special events
        if ((event as AgentEvent).type === 'turn_complete' || 
            (event as AgentEvent).type === 'error') {
          this.isRunning = false;
        }
      }
    } catch (error) {
      console.error('Agent error:', error);
      this.emitEvent({
        type: 'error',
        error: { message: (error as Error).message },
      } as AgentEvent);
      this.isRunning = false;
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isRunning = false;
  }

  async switchModel(model: string, provider: string): Promise<boolean> {
    if (!this.agent) return false;

    try {
      // Update agent config
      this.agent.updateConfig({
        model,
      });

      return true;
    } catch (error) {
      console.error('Failed to switch model:', error);
      return false;
    }
  }

  clearConversation(): void {
    if (!this.agent) return;
    this.agent.clearMessages();
  }

  onEvent(callback: (event: AgentEvent) => void): () => void {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  private emitEvent(event: AgentEvent): void {
    // Send to all renderer windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('agent:event', event);
    });

    // Call local listeners
    this.eventListeners.forEach(listener => listener(event));
  }

  get isProcessing(): boolean {
    return this.isRunning;
  }
}

// Create singleton instance
export const agentBridge = new AgentBridge();

// Export for use in main process
export default agentBridge;
