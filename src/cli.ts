import { Command } from 'commander';
import { APP_NAME, APP_VERSION, APP_DESCRIPTION } from './constants.js';

export interface CLIArgs {
  model?: string;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  permissionMode?: string;
  resume?: string;
  verbose?: boolean;
  prompt?: string;
}

export function parseCLI(argv: string[]): CLIArgs {
  const program = new Command();

  program
    .name(APP_NAME)
    .version(APP_VERSION)
    .description(APP_DESCRIPTION)
    .option('-m, --model <model>', 'Model to use (e.g., gpt-4o, claude-opus, grok-3)')
    .option('-p, --provider <provider>', 'LLM provider (anthropic, openai, google, mistral, groq, xai)')
    .option('--api-key <key>', 'API key for the provider')
    .option('--base-url <url>', 'Base URL for OpenAI-compatible endpoints')
    .option('--permission-mode <mode>', 'Permission mode: ask, auto-allow, deny-all', 'ask')
    .option('-r, --resume [sessionId]', 'Resume a previous session')
    .option('-v, --verbose', 'Enable verbose logging')
    .argument('[prompt]', 'Initial prompt to send')
    .parse(argv);

  const opts = program.opts();
  const args = program.args;

  return {
    model: opts.model,
    provider: opts.provider,
    apiKey: opts.apiKey,
    baseUrl: opts.baseUrl,
    permissionMode: opts.permissionMode,
    resume: opts.resume,
    verbose: opts.verbose,
    prompt: args[0],
  };
}
