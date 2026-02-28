import React from 'react';
import { render } from 'ink';
import 'dotenv/config';

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
  let activeProvider = resolved?.provider || providerRegistry.getProvider(currentProviderName);
  if (resolved) {
    currentModel = resolved.model.id;
    currentProviderName = resolved.provider.name;
    activeProvider = resolved.provider;
  }

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
  const toolRunner = new ToolRunner(toolRegistry, permissionManager, eventBus);

  // Initialize cost tracker
  const costTracker = new CostTracker();

  // Initialize slash commands
  const commandRegistry = new CommandRegistry();
  registerBuiltinCommands(commandRegistry);

  // Create the agent
  const agent = new AgentImpl(
    {
      provider: activeProvider,
      model: currentModel,
      systemPrompt: SYSTEM_PROMPT + (config.get('systemPromptAppend') || ''),
      tools: toolRegistry.getAll(),
      temperature: config.get('temperature'),
      planMode: false,
    },
    toolRunner,
    costTracker,
  );

  // Handle slash commands
  const handleSlashCommand = async (input: string): Promise<string | void> => {
    return commandRegistry.execute(input, {
      agent,
      config,
      providerRegistry,
      costTracker,
      setModel: (model: string, provider: string) => {
        currentModel = model;
        currentProviderName = provider;
      },
    });
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
    for await (const event of agent.run(cliArgs.prompt)) {
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
    }
    console.log('\n');
    console.log(costTracker.getSummary());
    process.exit(0);
  }

  // Interactive mode: render the Ink app
  const { waitUntilExit } = render(
    React.createElement(App, {
      agent,
      model: currentModel,
      provider: currentProviderName,
      onSlashCommand: handleSlashCommand,
    }),
  );

  await waitUntilExit();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
