import React from 'react';
import { render } from 'ink';
import 'dotenv/config';
import * as path from 'node:path';

import { parseCLI } from './cli.js';
import { ConfigManager } from './config/config-manager.js';
import { ProviderRegistry } from './providers/provider-registry.js';
import { AnthropicProvider } from './providers/anthropic/anthropic-provider.js';
import { OpenAIProvider } from './providers/openai/openai-provider.js';
import { GoogleProvider } from './providers/google/google-provider.js';
import { MistralProvider } from './providers/mistral/mistral-provider.js';
import { GroqProvider } from './providers/groq/groq-provider.js';
import { XAIProvider } from './providers/xai/xai-provider.js';
import { OpenAICompatProvider } from './providers/openai-compatible/openai-compat-provider.js';
import { BedrockProvider } from './providers/aws/bedrock-provider.js';
import { ToolRegistry } from './tools/tool-registry.js';
import { ToolRunner } from './tools/tool-runner.js';
import { registerBuiltinTools } from './tools/builtin/index.js';
import { PermissionManager } from './permissions/permission-manager.js';
import { AgentImpl } from './core/agent.js';
import { CostTracker } from './core/cost-tracker.js';
import { CommandRegistry, registerBuiltinCommands } from './commands/index.js';
import { EventBus } from './utils/event-bus.js';
import { setLogLevel } from './utils/logger.js';
import { App } from './ui/components/App.js';
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from './constants.js';
import type { PermissionMode } from './config/config-schema.js';
import type { UnifiedMessage } from './core/message-types.js';

// Memory & Session imports
import { MemoryStore } from './memory/memory-store.js';
import { SessionStore } from './session/session-store.js';
import { ProjectContextLoader } from './memory/project-context.js';
import { ProjectAnalyzer } from './memory/project-analyzer.js';

// Orchestration
import { AutoOrchestrator } from './core/orchestration/index.js';
import type { OrchestrationConfig } from './core/orchestration/index.js';

const SYSTEM_PROMPT = `You are omni-code, a powerful AI coding assistant running in the terminal.
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

The user's current working directory is: ${process.cwd()}
`;

async function main() {
  const cliArgs = parseCLI(process.argv);

  // Load configuration
  const config = new ConfigManager();
  if (cliArgs.permissionMode) {
    config.overrideWith({ permissionMode: cliArgs.permissionMode as PermissionMode });
  }
  setLogLevel(config.get('logLevel'));

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

  // Register custom OpenAI-compatible endpoints (Ollama, LM Studio, vLLM, etc.)
  for (const [name, endpoint] of Object.entries(config.get('customEndpoints'))) {
    const provider = new OpenAICompatProvider(name, endpoint);
    providerRegistry.register(provider);
  }

  // Build provider configs from config file + environment variables
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

  // Resolve model
  let currentModel = cliArgs.model || config.get('defaultModel') || DEFAULT_MODEL;
  let currentProviderName = cliArgs.provider || config.get('defaultProvider') || DEFAULT_PROVIDER;

  const resolved = providerRegistry.resolveModel(currentModel);
  if (resolved) {
    currentModel = resolved.model.id;
    currentProviderName = resolved.provider.name;
  } else if (cliArgs.model && !cliArgs.provider) {
    // Model not in registry — try to infer provider from model name prefix
    const prefixMap: Record<string, string> = {
      'grok': 'xai', 'gpt': 'openai', 'o1': 'openai', 'o3': 'openai', 'o4': 'openai',
      'claude': 'anthropic', 'gemini': 'google', 'mistral': 'mistral',
      'codestral': 'mistral', 'llama': 'groq', 'mixtral': 'groq',
      'anthropic.': 'bedrock',
    };
    for (const [prefix, provider] of Object.entries(prefixMap)) {
      if (currentModel.startsWith(prefix)) {
        currentProviderName = provider;
        break;
      }
    }
  }

  let activeProvider = resolved?.provider || providerRegistry.getProvider(currentProviderName);

  if (!activeProvider || !activeProvider.isAvailable()) {
    console.error(`Error: Provider "${currentProviderName}" is not available.`);
    console.error('Make sure you have set the appropriate API key:');
    console.error('  ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY, etc.');
    console.error('\nOr configure in ~/.omnicode/config.json');
    process.exit(1);
  }

  // Initialize tools
  const toolRegistry = new ToolRegistry();
  registerBuiltinTools(toolRegistry);

  // Disable any tools from config
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

  // Initialize memory & session stores
  const memoryStore = new MemoryStore();
  const sessionStore = new SessionStore();

  // Load project context from OMNICODE.md files
  const contextLoader = new ProjectContextLoader();
  let projectContext = '';
  try {
    projectContext = await contextLoader.load(process.cwd());
  } catch {
    // No project context found - that's fine
  }

  // Load project-specific memories
  const projectName = path.basename(process.cwd());
  const memories = memoryStore.getForProject(projectName);

  // Auto-analyze project on first run
  const projectAnalyzer = new ProjectAnalyzer();
  let projectAnalysis = '';
  try {
    projectAnalysis = await projectAnalyzer.analyzeAndStore(process.cwd(), memoryStore);
  } catch {
    // Analysis failure is non-fatal
  }

  // Build system prompt with context and memories
  let systemPrompt = SYSTEM_PROMPT;
  if (projectContext) {
    systemPrompt += `\n\n## Project Context (from OMNICODE.md)\n${projectContext}`;
  }
  if (projectAnalysis) {
    systemPrompt += `\n\n${projectAnalysis}`;
  }
  if (memories.length > 0) {
    const memoryBlock = memories.map(m => `- [${m.category}] ${m.content}`).join('\n');
    systemPrompt += `\n\n## Remembered Facts\n${memoryBlock}`;
  }
  systemPrompt += config.get('systemPromptAppend') || '';

  // Handle --resume: load existing session
  let existingMessages: UnifiedMessage[] | undefined;
  let sessionId: string | undefined;

  if (cliArgs.resume) {
    try {
      if (cliArgs.resume === true) {
        // Resume most recent session for this cwd
        const recent = sessionStore.listRecent(process.cwd(), 1);
        if (recent.length > 0) {
          const session = sessionStore.load(recent[0].id);
          if (session) {
            existingMessages = JSON.parse(session.messages);
            sessionId = session.id;
            currentModel = session.model;
            currentProviderName = session.provider;
            // Re-resolve provider for resumed session
            const resumedProvider = providerRegistry.getProvider(currentProviderName);
            if (resumedProvider?.isAvailable()) {
              activeProvider = resumedProvider;
            }
            console.log(`Resuming session ${sessionId?.substring(0, 8)} (${currentModel})`);
          }
        }
      } else if (typeof cliArgs.resume === 'string') {
        const session = sessionStore.load(cliArgs.resume);
        if (session) {
          existingMessages = JSON.parse(session.messages);
          sessionId = session.id;
          currentModel = session.model;
          currentProviderName = session.provider;
          const resumedProvider = providerRegistry.getProvider(currentProviderName);
          if (resumedProvider?.isAvailable()) {
            activeProvider = resumedProvider;
          }
          console.log(`Resuming session ${sessionId?.substring(0, 8)} (${currentModel})`);
        }
      }
    } catch (err) {
      console.warn('Could not resume session:', (err as Error).message);
    }
  }

  // Initialize slash commands
  const commandRegistry = new CommandRegistry();
  registerBuiltinCommands(commandRegistry);

  // Resolve extended thinking config
  const extendedThinkingConfig = config.get('extendedThinking');
  const thinkingEnabled = cliArgs.thinking || extendedThinkingConfig.enabled;
  const thinking = thinkingEnabled
    ? { enabled: true, budgetTokens: extendedThinkingConfig.budgetTokens }
    : undefined;

  // Create the agent
  const agent = new AgentImpl(
    {
      provider: activeProvider!,
      model: currentModel,
      systemPrompt,
      tools: toolRegistry.getAll(),
      temperature: config.get('temperature'),
      maxContextTokens: config.get('maxContextTokens'),
      thinking,
    },
    toolRunner,
    costTracker,
    existingMessages,
  );

  // Initialize orchestrator
  const orchestrationConfig: OrchestrationConfig = config.get('orchestration') as OrchestrationConfig;
  const orchestrator = new AutoOrchestrator(
    activeProvider!,
    currentModel,
    systemPrompt,
    toolRegistry.getAll(),
    toolRunner,
    costTracker,
    orchestrationConfig,
  );

  // Session auto-save on exit
  const saveSession = () => {
    try {
      const agentMessages = agent.messages;
      if (agentMessages.length > 0) {
        const firstUserMsg = agentMessages.find(m => m.role === 'user');
        const summary = firstUserMsg
          ? (typeof firstUserMsg.content === 'string'
              ? firstUserMsg.content.substring(0, 100)
              : '')
          : '';

        sessionStore.save({
          id: sessionId || agent.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: currentModel,
          provider: currentProviderName,
          cwd: process.cwd(),
          summary,
          messages: JSON.stringify(agentMessages),
          metadata: JSON.stringify({ cost: costTracker.getSummary() }),
        });
      }
    } catch {
      // Silently ignore save errors on exit
    }
  };
  process.on('beforeExit', saveSession);
  process.on('SIGINT', () => {
    saveSession();
    process.exit(0);
  });

  // UI state updater - passed to commands so they can trigger re-renders
  let uiStateUpdater: ((updates: { model?: string; provider?: string; systemPrompt?: string; planMode?: boolean }) => void) | undefined;

  // Handle slash commands
  const handleSlashCommand = async (input: string): Promise<string | void> => {
    return commandRegistry.execute(input, {
      agent,
      config,
      providerRegistry,
      costTracker,
      memoryStore,
      sessionStore,
      orchestrator,
      setModel: (model: string, provider: string) => {
        currentModel = model;
        currentProviderName = provider;
      },
      updateUIState: uiStateUpdater,
    });
  };

  // Callback to receive the UI state updater from the App component
  const handleUIStateUpdaterReady = (updater: (updates: { model?: string; provider?: string; systemPrompt?: string; planMode?: boolean }) => void) => {
    uiStateUpdater = updater;
  };

  // Handle permission requests from the event bus
  eventBus.on('permission_request', (request) => {
    // In auto-allow mode, just allow everything
    if (config.get('permissionMode') === 'auto-allow') {
      request.onAllow();
      return;
    }
    // Otherwise the UI will show the permission prompt
    // For now in the initial version, auto-allow for simplicity
    request.onAllow();
  });

  // If a prompt was provided via CLI, handle it
  if (cliArgs.prompt) {
    // Non-interactive mode: run the prompt and exit
    console.log(`omni-code: Running with ${currentModel} (${currentProviderName})\n`);
    for await (const event of orchestrator.execute(cliArgs.prompt, agent)) {
      if (event.type === 'stream_delta' && event.delta.type === 'text' && event.delta.text) {
        process.stdout.write(event.delta.text);
      }
      if (event.type === 'tool_call_start') {
        console.log(`\n  ⚡ ${event.toolName}(${Object.entries(event.input).map(([k,v]) => `${k}: ${String(v).substring(0, 80)}`).join(', ')})`);
      }
      if (event.type === 'tool_call_end') {
        const preview = event.result.content.substring(0, 200).replace(/\n/g, ' ');
        console.log(`    → ${event.result.isError ? 'ERROR: ' : ''}${preview}${event.result.content.length > 200 ? '...' : ''}`);
      }
      if (event.type === 'error') {
        console.error(`\nError: ${event.error.message}`);
      }
      if (event.type === 'orchestration_task_start') {
        console.log(`\n  🔄 [${event.capability}] ${event.description}`);
      }
      if (event.type === 'orchestration_task_end') {
        console.log(`  ${event.success ? '✓' : '✗'} Task ${event.taskId} ${event.success ? 'completed' : 'failed'} (${event.durationMs}ms)`);
      }
      if (event.type === 'orchestration_synthesis') {
        console.log(`\n📋 Synthesis:\n${event.summary}`);
      }
      if (event.type === 'orchestration_complete') {
        console.log(`\n${event.summary}`);
      }
    }
    console.log('\n');
    console.log(costTracker.getSummary());
    saveSession();
    process.exit(0);
  }

  // Interactive mode: render the Ink app
  const { waitUntilExit } = render(
    React.createElement(App, {
      agent,
      model: currentModel,
      provider: currentProviderName,
      onSlashCommand: handleSlashCommand,
      orchestrator,
      onUIStateUpdaterReady: handleUIStateUpdaterReady,
    }),
  );

  await waitUntilExit();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
