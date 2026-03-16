// Core Integration - Initializes omni-code core for Electron
import { ConfigManager } from '../src/config/config-manager.js';
import { ProviderRegistry } from '../src/providers/provider-registry.js';
import { AnthropicProvider } from '../src/providers/anthropic/anthropic-provider.js';
import { OpenAIProvider } from '../src/providers/openai/openai-provider.js';
import { GoogleProvider } from '../src/providers/google/google-provider.js';
import { MistralProvider } from '../src/providers/mistral/mistral-provider.js';
import { GroqProvider } from '../src/providers/groq/groq-provider.js';
import { XAIProvider } from '../src/providers/xai/xai-provider.js';
import { BedrockProvider } from '../src/providers/aws/bedrock-provider.js';
import { MoonshotProvider } from '../src/providers/moonshot/moonshot-provider.js';
import { ToolRegistry } from '../src/tools/tool-registry.js';
import { registerBuiltinTools } from '../src/tools/builtin/index.js';
import { PermissionManager } from '../src/permissions/permission-manager.js';
import type { PermissionMode } from '../src/config/config-schema.js';
import { ToolRunner } from '../src/tools/tool-runner.js';
import { AgentImpl } from '../src/core/agent.js';
import { CostTracker } from '../src/core/cost-tracker.js';
import { EventBus } from '../src/utils/event-bus.js';
import { agentBridge } from './agent-bridge.js';
import { setToolsRef, setConfigRef, setAgentRef } from './ipc-handlers.js';
import { getUsageStorage } from './usage-storage.js';
import type { UsageRecord } from '../src/core/usage-types.js';
import { settingsManager } from './settings.js';

let coreInitialized = false;
let currentWorkingDirectory = process.cwd();
let agentInstance: AgentImpl | null = null;

// Module-level PermissionManager so its mode can be updated at runtime.
// Initialized to 'auto-allow' until initializeCore() creates it with the
// correct EventBus and the settings are loaded.
let permissionManager: PermissionManager | null = null;

function toPermissionMode(autoRunMode: string): PermissionMode {
  if (autoRunMode === 'ask') return 'ask';
  if (autoRunMode === 'never') return 'deny-all';
  return 'auto-allow'; // 'always' or any unknown value → safe default
}

export function setPermissionMode(autoRunMode: string): void {
  if (permissionManager) {
    permissionManager.setMode(toPermissionMode(autoRunMode));
  }
}

// Build system prompt with current working directory
function buildSystemPrompt(cwd: string): string {
  return `You are omni-code, a powerful AI coding assistant running in the Electron GUI.
You help users with software engineering tasks: writing code, debugging, refactoring, explaining code, and more.

You have access to tools for reading/writing files, searching codebases, running shell commands, and more.
Use these tools to accomplish tasks effectively and autonomously — do not stop after writing files and tell the user to run things themselves.

## Core Guidelines
- Read files before modifying them to understand existing patterns
- Prefer editing existing files over creating new ones
- Use Glob and Grep for searching the codebase
- Use Bash for running commands, tests, and builds
- Be concise in your responses
- Ask for clarification when requirements are ambiguous

## Web Search
- Use SearchWeb to find packages, API references, documentation, and examples.
  Prefer it over guessing when you need: package names, correct API shapes, CLI flags, configuration options, or explanations for errors.
- Use WebFetch to read a specific documentation URL, README, or changelog.
- Use HTTPClient to probe API endpoints or health-check a running service.
- Search before inventing: if you are unsure of a library's API or a tool's flags, search rather than guessing.

## Verifying Projects Work
After scaffolding a new project or making significant changes, always verify it works end-to-end:

1. Install dependencies — use DependencyManager or Bash (npm install / pip install / cargo build / etc.)
2. Build — run the build command with Bash (npm run build, tsc, cargo build, etc.) and read any errors carefully.
   If the build fails, fix the errors and rebuild before moving on.
3. Start the dev server — use ProcessManager.start with the dev command (e.g. "npm run dev").
4. Wait for readiness — use ProcessManager.wait_url to poll until the server responds (e.g. "http://localhost:3000").
5. Visual verification — use Browser.navigate followed by Browser.screenshot to confirm the UI renders correctly.
   If Puppeteer is not installed, skip this step and note it to the user.
6. API verification — use HTTPClient to probe key API endpoints and confirm responses are correct.
7. Run tests — use RunTests if a test script or test framework config is present.

Do NOT hand off to the user after writing files. Run the project, observe the result, fix any issues, and confirm it works before finishing.

## Working Directory
The user's current working directory is: ${cwd}
Always use this working directory for file operations and searches unless specifically asked to work elsewhere.
`;
}

export function setWorkingDirectory(cwd: string): void {
  currentWorkingDirectory = cwd;
  console.log('Working directory updated to:', cwd);

  const newSystemPrompt = buildSystemPrompt(cwd);
  agentBridge.updateWorkspaceContext(cwd, newSystemPrompt);

  // Keep the legacy singleton in sync as well if one is ever assigned.
  if (agentInstance) {
    agentInstance.updateConfig({
      systemPrompt: newSystemPrompt,
      cwd,
    });
    console.log('Agent updated with new working directory:', cwd);
  }
}

export function getWorkingDirectory(): string {
  return currentWorkingDirectory;
}

export async function initializeCore(): Promise<void> {
  if (coreInitialized) return;

  try {
    console.log('Initializing omni-code core...');

    // Initialize configuration
    const config = new ConfigManager();

    // Initialize event bus
    const eventBus = new EventBus();

    // Initialize providers
    const providerRegistry = new ProviderRegistry();
    providerRegistry.register(new AnthropicProvider());
    providerRegistry.register(new OpenAIProvider());
    providerRegistry.register(new GoogleProvider());
    providerRegistry.register(new MistralProvider());
    providerRegistry.register(new GroqProvider());
    providerRegistry.register(new XAIProvider());
    providerRegistry.register(new BedrockProvider());
    providerRegistry.register(new MoonshotProvider());

    // Build provider configs from environment variables
    const providerConfigs: Record<string, any> = { ...config.get('providers') };
    const envKeys: Record<string, string> = {
      ANTHROPIC_API_KEY: 'anthropic',
      OPENAI_API_KEY: 'openai',
      GOOGLE_API_KEY: 'google',
      MISTRAL_API_KEY: 'mistral',
      GROQ_API_KEY: 'groq',
      XAI_API_KEY: 'xai',
      AWS_ACCESS_KEY_ID: 'bedrock',
      MOONSHOT_API_KEY: 'moonshot',
    };

    for (const [envVar, providerName] of Object.entries(envKeys)) {
      if (process.env[envVar] && !providerConfigs[providerName]?.apiKey) {
        providerConfigs[providerName] = {
          ...providerConfigs[providerName],
          apiKey: process.env[envVar],
        };
      }
    }

    await providerRegistry.initializeAll(providerConfigs);

    // Resolve default model and provider
    const defaultModel = config.get('defaultModel') || 'claude-sonnet-4-5';
    const defaultProvider = config.get('defaultProvider') || 'anthropic';

    const resolved = providerRegistry.resolveModel(defaultModel);
    const currentModel = resolved?.model.id || defaultModel;
    const currentProviderName = resolved?.provider.name || defaultProvider;
    const activeProvider = resolved?.provider || providerRegistry.getProvider(currentProviderName);

    if (!activeProvider || !activeProvider.isAvailable()) {
      console.warn(`Provider "${currentProviderName}" is not available.`);
    }

    // Initialize tools
    const toolRegistry = new ToolRegistry();
    registerBuiltinTools(toolRegistry);

    for (const toolName of config.get('disabledTools')) {
      toolRegistry.setEnabled(toolName, false);
    }

    // Create the module-level PermissionManager. Its mode defaults to 'auto-allow'
    // so existing behavior is preserved. The settings UI wires setPermissionMode()
    // to update it live after startup.
    permissionManager = new PermissionManager(
      'auto-allow',
      eventBus,
    );

    eventBus.on('permission_request', (request: {
      sessionId: string;
      toolName: string;
      toolId?: string;
      input: Record<string, unknown>;
      onAllow: () => void;
      onDeny: () => void;
      onAllowAlways: () => void;
    }) => {
      if (!request.toolId) {
        request.onDeny();
        return;
      }

      agentBridge.requestPermission(
        request.sessionId,
        request.toolName,
        request.toolId,
        request.input,
        {
          onAllow: request.onAllow,
          onDeny: request.onDeny,
          onAllowAlways: request.onAllowAlways,
        },
      );
    });

    eventBus.on('tool_call_progress', (event: {
      sessionId: string;
      toolName: string;
      toolId: string;
      message: string;
    }) => {
      agentBridge.emitToolProgress(event.sessionId, event.toolName, event.toolId, event.message);
    });

    // Handle user input requests from AskUser tool
    eventBus.on('user_input_request', (request: {
      sessionId: string;
      requestId: string;
      prompt: string;
      terminalCommand?: string;
      waitForInput: boolean;
      placeholder?: string;
      onResponse: (response: string) => void;
      onCancel: () => void;
    }) => {
      agentBridge.requestUserInput(
        request.sessionId,
        request.requestId,
        request.prompt,
        request.terminalCommand,
        request.waitForInput,
        request.placeholder,
        {
          onResponse: request.onResponse,
          onCancel: request.onCancel,
        },
      );
    });

    // Initialize tool runner (permissionManager is guaranteed non-null here)
    const toolRunner = new ToolRunner(toolRegistry, permissionManager!, eventBus, config.get('autoLintFix'));

    // Initialize cost tracker
    const costTracker = new CostTracker();

    // Build system prompt
    const systemPrompt = buildSystemPrompt(currentWorkingDirectory);

    // Set up refs for IPC handlers
    setToolsRef({
      execute: async (toolName: string, input: Record<string, unknown>) => {
        const tool = toolRegistry.get(toolName);
        if (!tool) throw new Error(`Tool ${toolName} not found`);
        
        const result = await toolRunner.execute(
          toolName,
          crypto.randomUUID(),
          input,
          {
            cwd: currentWorkingDirectory,
            sessionId: 'temp-session',
            planMode: false,
            abortSignal: new AbortController().signal,
            spawnSubAgent: async () => '',
          }
        );
        
        return result;
      },
      list: () => toolRegistry.getAll().map(t => ({
        name: t.tool.name,
        description: t.tool.description,
        category: t.tool.category,
        permissionLevel: t.tool.permissionLevel,
      })),
    });

    setConfigRef({
      get: (key: string) => config.get(key as any),
      set: (key: string, value: unknown) => config.set(key as any, value),
      getModels: () => {
        const allModels = providerRegistry.getAllModels();
        return allModels.map(m => {
          const provider = providerRegistry.getProvider(m.provider);
          return {
            id: m.id,
            name: m.displayName,
            provider: m.provider,
            available: provider?.isAvailable() || false,
          };
        });
      },
      getProviders: () => {
        const allModels = providerRegistry.getAllModels();
        const providers = new Map<string, { available: boolean; models: string[] }>();
        
        for (const model of allModels) {
          const existing = providers.get(model.provider);
          if (existing) {
            existing.models.push(model.id);
          } else {
            const provider = providerRegistry.getProvider(model.provider);
            providers.set(model.provider, {
              available: provider?.isAvailable() || false,
              models: [model.id],
            });
          }
        }
        
        return Array.from(providers.entries()).map(([name, info]) => ({
          name,
          available: info.available,
          models: info.models,
        }));
      },
    });

    // Initialize agent bridge with a factory function for creating new agent instances
    // This supports the multi-conversation feature where each tab gets its own agent
    // Now supports per-conversation model selection
    agentBridge.initialize((conversationId?: string, conversationModel?: string, conversationProvider?: string) => {
      const systemPrompt = buildSystemPrompt(currentWorkingDirectory);

      // Use conversation-specific model/provider if provided, otherwise fall back to global defaults
      const model = conversationModel || currentModel;
      const providerName = conversationProvider || currentProviderName;

      // Resolve the provider for this conversation
      let resolvedProvider: typeof activeProvider;
      if (conversationProvider && conversationProvider !== currentProviderName) {
        // Need to get a different provider than the global one
        resolvedProvider = providerRegistry.getProvider(conversationProvider);
      } else {
        resolvedProvider = activeProvider;
      }

      if (!resolvedProvider || !resolvedProvider.isAvailable()) {
        console.warn(`Provider "${providerName}" is not available for conversation ${conversationId}, falling back to global provider`);
        resolvedProvider = activeProvider;
      }

      // Create a cost tracker that records usage
      const conversationCostTracker = new CostTracker({
        conversationId,
        onUsageRecorded: async (record: UsageRecord) => {
          try {
            const usageStorage = await getUsageStorage();
            await usageStorage.recordUsage(record, currentWorkingDirectory);
          } catch (error) {
            console.error('[CostTracker] Failed to record usage:', error);
          }
        },
      });

      return new AgentImpl(
        {
          provider: resolvedProvider!,
          model: model,
          systemPrompt,
          tools: toolRegistry.getAll(),
          temperature: config.get('temperature'),
          maxContextTokens: config.get('maxContextTokens'),
          maxTurns: config.get('maxTurns'),
          contextCompressionThreshold: config.get('contextCompressionThreshold'),
          contextRecentMessagesToKeep: config.get('contextRecentMessagesToKeep'),
          planMode: false,
          cwd: currentWorkingDirectory,
          limitCheck: {
            check: async () => {
              try {
                const usageStorage = await getUsageStorage();
                const now = new Date();
                const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                // Get summary for current month
                const summary = await usageStorage.getSummary(month, currentWorkingDirectory);
                if (summary.error) {
                  return { allowed: true, percentage: 0 };
                }

                // Get monthly limit from settings
                const limits = await usageStorage.getAllMonthlyLimits();
                const monthlyLimit = limits[month] || config.get('usage.monthlyLimit') || 0;

                if (!monthlyLimit || monthlyLimit <= 0) {
                  return { allowed: true, percentage: 0 };
                }

                const percentage = (summary.totalCost / monthlyLimit) * 100;

                if (percentage >= 100) {
                  return {
                    allowed: false,
                    percentage,
                    warning: `Monthly limit exceeded: $${summary.totalCost.toFixed(2)} / $${monthlyLimit.toFixed(2)}`,
                  };
                }

                if (percentage >= 95) {
                  return {
                    allowed: true,
                    percentage,
                    warning: `Warning: You've used ${percentage.toFixed(0)}% of your monthly limit`,
                  };
                }

                if (percentage >= 80) {
                  return {
                    allowed: true,
                    percentage,
                    warning: `Notice: You've used ${percentage.toFixed(0)}% of your monthly limit`,
                  };
                }

                return { allowed: true, percentage };
              } catch (error) {
                console.error('[LimitCheck] Failed to check limit:', error);
                return { allowed: true, percentage: 0 };
              }
            },
          },
        },
        toolRunner,
        conversationCostTracker,
      ) as any;
    });

    // Set provider registry on agent bridge for model switching support
    agentBridge.setProviderRegistry(providerRegistry);
    agentBridge.setWorkspacePath(currentWorkingDirectory);

    // Set agent ref for IPC handlers with the new conversation-scoped API
    setAgentRef(agentBridge);

    coreInitialized = true;
    console.log('Core initialization complete');

    // Auto-share all registered workspaces so the remote server has multi-workspace access
    try {
      const { getSharedWorkspaceManager } = await import('./shared-workspace-manager.js');
      const sharedWM = getSharedWorkspaceManager();
      await sharedWM.initialize();
      await sharedWM.syncAllWorkspaces();
    } catch (error) {
      console.error('[CoreIntegration] Error syncing workspaces:', error);
    }

    // Initialize remote access server if enabled
    try {
      const remoteEnabled = settingsManager.get('remoteAccess.enabled') as boolean;
      const ngrokAuthToken = settingsManager.get('remoteAccess.ngrokAuthToken') as string;

      if (remoteEnabled && ngrokAuthToken) {
        console.log('[CoreIntegration] Remote access enabled, starting server...');
        const { initializeRemoteServer } = await import('./remote-server.js');
        const result = await initializeRemoteServer();

        if (result.success) {
          console.log('[CoreIntegration] Remote server started:', result.url);
        } else {
          console.error('[CoreIntegration] Failed to start remote server:', result.error);
        }
      }
    } catch (error) {
      console.error('[CoreIntegration] Error starting remote server:', error);
      // Don't fail core initialization if remote server fails
    }

  } catch (error) {
    console.error('Failed to initialize core:', error);
    throw error;
  }
}

export function isCoreInitialized(): boolean {
  return coreInitialized;
}
