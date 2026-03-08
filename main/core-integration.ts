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
import { ToolRegistry } from '../src/tools/tool-registry.js';
import { registerBuiltinTools } from '../src/tools/builtin/index.js';
import { PermissionManager } from '../src/permissions/permission-manager.js';
import { ToolRunner } from '../src/tools/tool-runner.js';
import { AgentImpl } from '../src/core/agent.js';
import { CostTracker } from '../src/core/cost-tracker.js';
import { EventBus } from '../src/utils/event-bus.js';
import { agentBridge } from './agent-bridge.js';
import { setToolsRef, setConfigRef, setAgentRef } from './ipc-handlers.js';

let coreInitialized = false;
let currentWorkingDirectory = process.cwd();
let agentInstance: AgentImpl | null = null;

// Build system prompt with current working directory
function buildSystemPrompt(cwd: string): string {
  return `You are omni-code, a powerful AI coding assistant running in the Electron GUI.
You help users with software engineering tasks: writing code, debugging, refactoring, explaining code, and more.

You have access to tools for reading/writing files, searching codebases, running shell commands, and more.
Use these tools to accomplish tasks effectively.

Key guidelines:
- Read files before modifying them to understand existing patterns
- Prefer editing existing files over creating new ones
- Use Glob and Grep for searching the codebase
- Use Bash for running commands, tests, and builds
- Be concise in your responses
- Ask for clarification when requirements are ambiguous

The user's current working directory is: ${cwd}
Always use this working directory for file operations and searches unless specifically asked to work elsewhere.
`;
}

export function setWorkingDirectory(cwd: string): void {
  currentWorkingDirectory = cwd;
  console.log('Working directory updated to:', cwd);
  
  // Update agent's system prompt and cwd if agent exists
  if (agentInstance) {
    const newSystemPrompt = buildSystemPrompt(cwd);
    agentInstance.updateConfig({ 
      systemPrompt: newSystemPrompt,
      cwd: cwd,
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

    // Initialize permission manager
    const permissionManager = new PermissionManager(
      config.get('permissionMode'),
      eventBus,
    );

    // Initialize tool runner
    const toolRunner = new ToolRunner(toolRegistry, permissionManager, eventBus, config.get('autoLintFix'));

    // Initialize cost tracker
    const costTracker = new CostTracker();

    // Build system prompt
    const systemPrompt = buildSystemPrompt(currentWorkingDirectory);

    // Create the agent
    agentInstance = new AgentImpl(
      {
        provider: activeProvider!,
        model: currentModel,
        systemPrompt,
        tools: toolRegistry.getAll(),
        temperature: config.get('temperature'),
        maxContextTokens: config.get('maxContextTokens'),
        planMode: false,
        cwd: currentWorkingDirectory,
      },
      toolRunner,
      costTracker,
    );

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
            sessionId: agentInstance!.id,
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
        category: t.category,
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

    // Initialize agent bridge
    await agentBridge.initialize(agentInstance as any);

    // Set agent ref for IPC handlers
    setAgentRef(agentBridge);

    coreInitialized = true;
    console.log('Core initialization complete');

  } catch (error) {
    console.error('Failed to initialize core:', error);
    throw error;
  }
}

export function isCoreInitialized(): boolean {
  return coreInitialized;
}
