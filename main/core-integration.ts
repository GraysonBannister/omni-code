// Core Integration - Initializes omni-code core for Electron
import * as path from 'node:path';
import { ConfigManager } from '../src/config/config-manager.js';
import { ProviderRegistry, type ProviderRegistry as ProviderRegistryType } from '../src/providers/provider-registry.js';
import { AnthropicProvider } from '../src/providers/anthropic/anthropic-provider.js';
import { OpenAIProvider } from '../src/providers/openai/openai-provider.js';
import { GoogleProvider } from '../src/providers/google/google-provider.js';
import { MistralProvider } from '../src/providers/mistral/mistral-provider.js';
import { GroqProvider } from '../src/providers/groq/groq-provider.js';
import { XAIProvider } from '../src/providers/xai/xai-provider.js';
import { BedrockProvider } from '../src/providers/aws/bedrock-provider.js';
import { MoonshotProvider } from '../src/providers/moonshot/moonshot-provider.js';
import { OpenAICompatProvider } from '../src/providers/openai-compatible/openai-compat-provider.js';
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
import { settingsManager, type SettingsSchema } from './settings.js';
import { rulesManager } from './rules-manager.js';
import { skillsManager } from './skills-manager.js';
import { loadInstalledAddons, getSystemPromptFragments, getToolOutputFilters } from './addon-loader.js';

let coreInitialized = false;
let currentWorkingDirectory = process.cwd();
let agentInstance: AgentImpl | null = null;
let providerRegistry: ProviderRegistry | null = null;
let toolRegistryRef: ToolRegistry | null = null;
let toolRunnerRef: ToolRunner | null = null;

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

export interface WorkspaceFolder {
  id: string;
  path: string;
  name?: string;
}

/** Assembles the addon-injected system prompt section, if any fragments are registered. */
function buildAddonPromptSection(): string {
  const fragments = getSystemPromptFragments();
  if (fragments.length === 0) return '';
  return '\n\n' + fragments.join('\n\n');
}

// Build system prompt with current working directory and active rules/skills
// When workspaceFolders is provided, the AI is given full multi-folder context.
function buildSystemPrompt(cwd: string, workspaceName?: string, workspaceFolders?: WorkspaceFolder[]): string {
  const rulesSection = rulesManager.buildRulesPrompt();
  const skillsSection = skillsManager.buildSkillsPrompt();

  let workingDirectorySection: string;

  if (workspaceFolders && workspaceFolders.length > 1) {
    const folderList = workspaceFolders
      .map(f => {
        const name = f.name || path.basename(f.path);
        const isActive = f.path === cwd;
        return `- ${name}: ${f.path}${isActive ? ' (active)' : ''}`;
      })
      .join('\n');

    workingDirectorySection = `## Workspace: ${workspaceName || 'Multi-folder Workspace'}
This is a multi-folder workspace containing ${workspaceFolders.length} projects:
${folderList}

The currently active folder is: ${cwd}
You have access to all folders in the workspace. When working on tasks, consider all projects unless the user specifies otherwise.
File operations and searches default to the active folder unless you specify an absolute path.`;
  } else {
    workingDirectorySection = `## Working Directory
The user's current working directory is: ${cwd}
Always use this working directory for file operations and searches unless specifically asked to work elsewhere.`;
  }

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

${workingDirectorySection}
${rulesSection}${skillsSection}${buildAddonPromptSection()}`;
}

// Currently active workspace context (set when in multi-folder workspace mode)
let currentWorkspaceName: string | undefined;
let currentWorkspaceFolders: WorkspaceFolder[] | undefined;

export async function setWorkingDirectory(cwd: string): Promise<void> {
  currentWorkingDirectory = cwd;
  console.log('Working directory updated to:', cwd);

  // Load rules and skills for the new workspace path
  await Promise.all([
    rulesManager.loadRules(cwd),
    skillsManager.loadSkills(cwd),
  ]);

  const newSystemPrompt = buildSystemPrompt(cwd, currentWorkspaceName, currentWorkspaceFolders);
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

// Per-window variant: only updates the conversations that belong to the requesting window,
// so that opening a folder in window B does not clobber window A's agent context.
export async function setWorkingDirectoryForWindow(cwd: string, conversationIds: string[]): Promise<void> {
  console.log(`Working directory updated for window (${conversationIds.length} conversations):`, cwd);

  // Load rules and skills for this workspace path
  await Promise.all([
    rulesManager.loadRules(cwd),
    skillsManager.loadSkills(cwd),
  ]);

  const newSystemPrompt = buildSystemPrompt(cwd, currentWorkspaceName, currentWorkspaceFolders);
  agentBridge.updateWorkspaceContextForConversations(cwd, newSystemPrompt, conversationIds);
}

/**
 * Set the full multi-folder workspace context so the AI knows about all projects.
 * Called when the user opens or creates a workspace with multiple folders.
 */
export async function setWorkspaceContext(
  activeFolderPath: string,
  workspaceName: string,
  folders: WorkspaceFolder[],
  conversationIds?: string[]
): Promise<void> {
  currentWorkingDirectory = activeFolderPath;
  currentWorkspaceName = workspaceName;
  currentWorkspaceFolders = folders;

  console.log(`[WorkspaceContext] Setting workspace "${workspaceName}" with ${folders.length} folder(s), active: ${activeFolderPath}`);

  // Load rules and skills from all workspace folders (merges them)
  await Promise.all(
    folders.map(f => Promise.all([
      rulesManager.loadRules(f.path),
      skillsManager.loadSkills(f.path),
    ]))
  );

  const newSystemPrompt = buildSystemPrompt(activeFolderPath, workspaceName, folders);

  if (conversationIds && conversationIds.length > 0) {
    agentBridge.updateWorkspaceContextForConversations(activeFolderPath, newSystemPrompt, conversationIds);
  } else {
    agentBridge.updateWorkspaceContext(activeFolderPath, newSystemPrompt);
  }

  if (agentInstance) {
    agentInstance.updateConfig({ systemPrompt: newSystemPrompt, cwd: activeFolderPath });
  }
}

/**
 * Clear multi-folder workspace context (e.g. when closing the workspace).
 */
export function clearWorkspaceContext(): void {
  currentWorkspaceName = undefined;
  currentWorkspaceFolders = undefined;
  console.log('[WorkspaceContext] Cleared workspace context');
}

export function refreshSystemPrompt(): void {
  const newSystemPrompt = buildSystemPrompt(currentWorkingDirectory, currentWorkspaceName, currentWorkspaceFolders);
  agentBridge.updateWorkspaceContext(currentWorkingDirectory, newSystemPrompt);
  if (agentInstance) {
    agentInstance.updateConfig({ systemPrompt: newSystemPrompt });
  }
}

export { rulesManager, skillsManager };

export function getWorkingDirectory(): string {
  return currentWorkingDirectory;
}

// Returns the working directory for a specific conversation. Falls back to
// the global directory when no per-conversation path is available (single-window mode).
export function getWorkingDirectoryForConversation(conversationId: string): string {
  return agentBridge.getWorkspacePathForConversation(conversationId) || currentWorkingDirectory;
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
    providerRegistry = new ProviderRegistry();
    providerRegistry.register(new AnthropicProvider());
    providerRegistry.register(new OpenAIProvider());
    providerRegistry.register(new GoogleProvider());
    providerRegistry.register(new MistralProvider());
    providerRegistry.register(new GroqProvider());
    providerRegistry.register(new XAIProvider());
    providerRegistry.register(new BedrockProvider());
    providerRegistry.register(new MoonshotProvider());

    // Register custom endpoints from settings
    const customModels = settingsManager.get('customModels') || [];
    console.log(`[CoreIntegration] Found ${customModels.length} custom model endpoints`);
    
    for (const customEndpoint of customModels) {
      try {
        // Create endpoint config for OpenAICompatProvider
        const endpointConfig = {
          baseUrl: customEndpoint.baseUrl,
          apiKey: customEndpoint.apiKey,
          models: customEndpoint.models.map(m => m.id),
        };
        
        // Create and register the provider with a unique name
        const customProvider = new OpenAICompatProvider(customEndpoint.id, endpointConfig);
        const uniqueProviderName = `custom-${customEndpoint.id}`;
        
        // Override the provider name to be unique for each custom endpoint
        // This prevents conflicts in the provider registry
        Object.defineProperty(customProvider, 'name', {
          value: uniqueProviderName,
          writable: false,
          configurable: true,
        });
        
        // Override the display name
        Object.defineProperty(customProvider, 'displayName', {
          value: customEndpoint.name,
          writable: true,
          configurable: true,
        });
        
        // Override the model capabilities with user-defined ones
        // Set the provider to the unique name so models are properly filtered
        (customProvider as any).models = customEndpoint.models.map(m => ({
          id: `${customEndpoint.id}/${m.id}`,
          provider: uniqueProviderName as any,
          displayName: m.displayName,
          aliases: [m.id],
          capabilities: {
            streaming: m.capabilities.streaming,
            toolUse: m.capabilities.toolUse,
            vision: m.capabilities.vision,
            jsonMode: m.capabilities.jsonMode,
            systemPrompt: m.capabilities.systemPrompt,
            caching: false,
            extendedThinking: false,
            maxContextWindow: m.capabilities.maxContextWindow,
            maxOutputTokens: m.capabilities.maxOutputTokens,
          },
          pricing: { inputPerMillion: 0, outputPerMillion: 0 },
        }));
        
        providerRegistry.register(customProvider);
        console.log(`[CoreIntegration] Registered custom endpoint: ${customEndpoint.name} (${uniqueProviderName}) with ${customEndpoint.models.length} models`);
      } catch (error) {
        console.error(`[CoreIntegration] Failed to register custom endpoint ${customEndpoint.id}:`, error);
      }
    }

    // Build provider configs from settings, config file, and environment variables
    // Priority: settingsManager > config file > environment variables
    const providerConfigs: Record<string, any> = { ...config.get('providers') };

    // Map provider names to their corresponding settingsManager apiKeys field
    const settingsApiKeys: Record<string, keyof SettingsSchema['apiKeys']> = {
      anthropic: 'anthropic',
      openai: 'openai',
      google: 'google',
      mistral: 'openai', // Mistral uses OpenAI-compatible API
      groq: 'groq',
      xai: 'xai',
      bedrock: 'anthropic', // Bedrock uses AWS credentials
      moonshot: 'moonshot',
    };

    // First, apply API keys from settingsManager (highest priority)
    const apiKeys = settingsManager.get('apiKeys');
    console.log('[CoreIntegration] API keys from settings:', Object.keys(apiKeys));
    console.log('[CoreIntegration] Moonshot key exists:', !!apiKeys['moonshot']);
    console.log('[CoreIntegration] Moonshot key length:', apiKeys['moonshot']?.length || 0);

    for (const [providerName, settingsKey] of Object.entries(settingsApiKeys)) {
      const apiKey = apiKeys[settingsKey];
      if (apiKey && typeof apiKey === 'string' && apiKey.trim()) {
        providerConfigs[providerName] = {
          ...providerConfigs[providerName],
          apiKey: apiKey.trim(),
        };
        console.log(`[CoreIntegration] Loaded API key for ${providerName} from settings`);
      } else {
        console.log(`[CoreIntegration] No API key found for ${providerName} in settings`);
      }
    }

    // Then, apply environment variables (lowest priority - only if not already set)
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

    // Add custom endpoint configs for initialization
    for (const customEndpoint of customModels) {
      providerConfigs[`custom-${customEndpoint.id}`] = {
        baseUrl: customEndpoint.baseUrl,
        apiKey: customEndpoint.apiKey,
      };
    }

    console.log('[CoreIntegration] Initializing providers with configs:', Object.keys(providerConfigs));
    await providerRegistry.initializeAll(providerConfigs);

    // Log provider availability after initialization
    const availableProviders = providerRegistry.getAvailable().map(p => p.name);
    console.log('[CoreIntegration] Available providers after init:', availableProviders);

    // Resolve default model and provider from activeModels or fallback to first available
    const activeModels = (config.get('activeModels') as string[] | undefined) || [];
    const allModels = providerRegistry.getAllModels();
    let defaultModel: string;
    let defaultProvider: string;

    if (activeModels.length > 0) {
      // Use first active model
      const firstActiveId = activeModels[0];
      const resolved = providerRegistry.resolveModel(firstActiveId);
      defaultModel = resolved?.model.id || firstActiveId;
      defaultProvider = resolved?.provider.name || 'openai';
    } else {
      // Fallback to first available model
      const firstModel = allModels[0];
      defaultModel = firstModel?.id || 'claude-sonnet-4-5';
      defaultProvider = firstModel?.provider || 'anthropic';
    }

    const resolved = providerRegistry.resolveModel(defaultModel);
    const currentModel = resolved?.model.id || defaultModel;
    const currentProviderName = resolved?.provider.name || defaultProvider;
    const activeProvider = resolved?.provider || providerRegistry.getProvider(currentProviderName);

    if (!activeProvider || !activeProvider.isAvailable()) {
      console.warn(`Provider "${currentProviderName}" is not available.`);
    } else {
      console.log(`[CoreIntegration] Default provider "${currentProviderName}" is available`);
    }

    // Initialize tools
    const toolRegistry = new ToolRegistry();
    registerBuiltinTools(toolRegistry);
    toolRegistryRef = toolRegistry;

    // Load any installed add-ons so their tools are available to the agent
    await loadInstalledAddons(toolRegistry);

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

    // Determine which directories the agent must never write to.
    // At minimum this is the application's own install/source directory so the agent
    // cannot rewrite the app itself while it is running.
    const { app } = await import('electron');
    const appRoot = path.resolve(app.getAppPath());
    // Also protect the directory containing the compiled main bundle (__dirname) because
    // in production builds getAppPath() points to the .asar archive while __dirname is
    // the directory next to it (e.g. Contents/Resources/).
    const mainDir = path.resolve(__dirname);
    const protectedAppPaths = [...new Set([appRoot, mainDir])];

    // Initialize tool runner (permissionManager is guaranteed non-null here)
    const toolRunner = new ToolRunner(toolRegistry, permissionManager!, eventBus, config.get('autoLintFix'), protectedAppPaths);
    toolRunnerRef = toolRunner;
    toolRunner.setOutputFilters([...getToolOutputFilters()]);

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
            maxContextWindow: m.capabilities?.maxContextWindow,
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

      // Thinking is controlled by model selection: if the user picked a "(Thinking)" variant
      // (extendedThinking: true in the registry), always enable it. Otherwise never request it.
      // The global "Show Thinking" setting only controls whether the UI displays the thoughts.
      const modelInfo = resolvedProvider?.getModelInfo(model);
      const modelRequestsThinking = modelInfo?.capabilities?.extendedThinking ?? false;
      const thinkingConfig = modelRequestsThinking
        ? { enabled: true, budgetTokens: 8000 } // 8k budget; provider will enforce budget < max_tokens
        : undefined;

      console.log('[core-integration] Creating agent:', {
        model,
        provider: providerName,
        modelRequestsThinking,
        thinkingEnabled: !!thinkingConfig,
        modelId: modelInfo?.id,
        modelApiId: modelInfo?.apiId,
      });

      return new AgentImpl(
        {
          provider: resolvedProvider!,
          model: model,
          systemPrompt,
          tools: toolRegistry.getAll(),
          temperature: config.get('temperature'),
          maxContextTokens: config.get('maxContextTokens'),
          maxTurns: settingsManager.get('ai.maxTurns') ?? null,
          contextCompressionThreshold: config.get('contextCompressionThreshold'),
          contextRecentMessagesToKeep: config.get('contextRecentMessagesToKeep'),
          planMode: false,
          cwd: currentWorkingDirectory,
          thinking: thinkingConfig,
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

    // Auto-connect to remote host if configured
    try {
      const remoteClientUrl = settingsManager.get('remoteClient.url') as string;
      const remoteClientApiKey = settingsManager.get('remoteClient.apiKey') as string;
      const remoteClientAutoConnect = settingsManager.get('remoteClient.autoConnect') as boolean;

      if (remoteClientAutoConnect && remoteClientUrl && remoteClientApiKey) {
        console.log('[CoreIntegration] Auto-connecting to remote host:', remoteClientUrl);
        const { remoteClientMode } = await import('./remote-client-mode.js');
        const result = await remoteClientMode.connect(remoteClientUrl, remoteClientApiKey);

        if (result.success) {
          console.log('[CoreIntegration] Connected to remote host:', remoteClientUrl);
        } else {
          console.error('[CoreIntegration] Failed to connect to remote host:', result.error);
        }
      }
    } catch (error) {
      console.error('[CoreIntegration] Error auto-connecting to remote host:', error);
      // Don't fail core initialization if remote client connection fails
    }

    // Listen for API key changes and re-initialize providers
    settingsManager.onChange((key: string, value: any) => {
      if (key.startsWith('apiKeys.')) {
        const providerName = key.replace('apiKeys.', '');
        console.log(`[CoreIntegration] API key changed for provider: ${providerName}`);

        // Re-initialize providers with the new API key
        reinitializeProviders().then(result => {
          if (result.success) {
            console.log(`[CoreIntegration] Providers re-initialized after API key change for ${providerName}`);
          } else {
            console.error(`[CoreIntegration] Failed to re-initialize providers: ${result.error}`);
          }
        });
      }
    });

  } catch (error) {
    console.error('Failed to initialize core:', error);
    throw error;
  }
}

export function isCoreInitialized(): boolean {
  return coreInitialized;
}

/**
 * Re-initialize providers with updated API keys from settings.
 * Call this when API keys change in settings.
 */
export async function reinitializeProviders(): Promise<{ success: boolean; error?: string }> {
  if (!providerRegistry) {
    return { success: false, error: 'Provider registry not initialized' };
  }

  try {
    console.log('[CoreIntegration] Re-initializing providers with updated API keys...');

    // Build provider configs from settings (same logic as in initializeCore)
    const providerConfigs: Record<string, any> = {};

    const settingsApiKeys: Record<string, keyof SettingsSchema['apiKeys']> = {
      anthropic: 'anthropic',
      openai: 'openai',
      google: 'google',
      mistral: 'openai',
      groq: 'groq',
      xai: 'xai',
      bedrock: 'anthropic',
      moonshot: 'moonshot',
    };

    // Apply API keys from settingsManager
    const apiKeys = settingsManager.get('apiKeys');
    console.log('[CoreIntegration:Reinit] API keys from settings:', Object.keys(apiKeys));
    console.log('[CoreIntegration:Reinit] Moonshot key exists:', !!apiKeys['moonshot']);

    for (const [providerName, settingsKey] of Object.entries(settingsApiKeys)) {
      const apiKey = apiKeys[settingsKey];
      if (apiKey && typeof apiKey === 'string' && apiKey.trim()) {
        providerConfigs[providerName] = {
          ...providerConfigs[providerName],
          apiKey: apiKey.trim(),
        };
        console.log(`[CoreIntegration:Reinit] Loaded API key for ${providerName}`);
      } else {
        console.log(`[CoreIntegration:Reinit] No API key for ${providerName}`);
      }
    }

    // Apply environment variables (only if not already set)
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

    // Log which providers are now available
    const availableProviders = providerRegistry.getAvailable().map(p => p.name);
    console.log('[CoreIntegration] Providers re-initialized. Available:', availableProviders);

    return { success: true };
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error('[CoreIntegration] Failed to re-initialize providers:', error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Get the provider registry instance.
 * Used by IPC handlers to access provider information.
 */
export function getProviderRegistry(): ProviderRegistryType | null {
  return providerRegistry;
}

/**
 * Reload all installed add-ons into the live ToolRegistry.
 * Call after install or uninstall so the agent picks up changes immediately
 * without requiring an app restart.
 */
export async function reloadAddons(): Promise<void> {
  if (toolRegistryRef) {
    await loadInstalledAddons(toolRegistryRef);
    // Re-sync output filters after addons are reloaded
    toolRunnerRef?.setOutputFilters([...getToolOutputFilters()]);
  }
}
