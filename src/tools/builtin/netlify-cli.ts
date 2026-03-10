import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { PlatformCLIManager } from './platform-cli-manager.js';

export class NetlifyTool extends PlatformCLIManager implements Tool {
  readonly name = 'Netlify';
  readonly description = 'Execute Netlify CLI commands for deployment, environment variables, functions, and site management. WARNING: Can deploy to production.';
  readonly permissionLevel = PermissionLevel.DANGEROUS;
  readonly category = ToolCategory.EXECUTE;
  readonly availableInPlanMode = false;

  protected cliName = 'Netlify';
  protected cliCommand = 'netlify';

  readonly inputSchema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        enum: [
          'init',
          'link',
          'deploy',
          'dev',
          'build',
          'env list',
          'env get',
          'env set',
          'env unset',
          'env import',
          'functions list',
          'functions build',
          'functions create',
          'sites list',
          'sites create',
          'sites delete',
          'open',
          'status',
          'login',
          'logout',
          'unlink',
        ],
        description: 'The Netlify CLI command to execute. DANGER: deploy command publishes to production. Use --prod flag explicitly for production deploys.',
      },
      siteId: {
        type: 'string',
        description: 'Site ID for link/deploy commands',
      },
      flags: {
        type: 'array',
        items: { type: 'string' },
        description: 'CLI flags like --prod (production deploy), --build (build before deploy), --dir (publish directory), --functions (functions directory)',
      },
      key: {
        type: 'string',
        description: 'Environment variable key for env commands',
      },
      value: {
        type: 'string',
        description: 'Environment variable value for env set command',
      },
      functionName: {
        type: 'string',
        description: 'Function name for functions commands',
      },
    },
    required: ['command'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.command !== 'string' || !input.command.trim()) {
      return 'command must be a non-empty string';
    }

    const validCommands = this.inputSchema.properties.command.enum as string[];
    if (!validCommands.includes(input.command)) {
      return `command must be one of: ${validCommands.join(', ')}`;
    }

    // env set requires key and value
    if (input.command === 'env set') {
      if (!input.key || typeof input.key !== 'string') {
        return 'env set command requires a "key" parameter';
      }
      if (!input.value || typeof input.value !== 'string') {
        return 'env set command requires a "value" parameter';
      }
    }

    // env get and env unset require key
    if (['env get', 'env unset'].includes(input.command)) {
      if (!input.key || typeof input.key !== 'string') {
        return `${input.command} command requires a "key" parameter`;
      }
    }

    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const installed = await this.isCLIInstalled();
    if (!installed) {
      return {
        content: `Netlify CLI is not installed.\n\n${this.getInstallInstructions()}`,
        isError: true,
      };
    }

    const command = input.command as string;
    const args: string[] = [];

    // Add flags first
    const flags = input.flags as string[] | undefined;
    if (flags) {
      args.push(...flags);
    }

    // Add site ID if provided
    if (input.siteId) {
      args.push('--site', input.siteId as string);
    }

    // Parse composite commands like "env list", "functions build"
    const [mainCmd, subCmd] = command.split(' ');

    // Handle env set with key=value
    if (command === 'env set' && input.key && input.value) {
      args.push(input.key as string, input.value as string);
    }

    // Handle env get/unset with key
    if ((command === 'env get' || command === 'env unset') && input.key) {
      args.push(input.key as string);
    }

    // Handle functions create with name
    if (command === 'functions create' && input.functionName) {
      args.push(input.functionName as string);
    }

    const result = await this.executeCommand(
      mainCmd,
      subCmd ? [subCmd, ...args] : args,
      { cwd: context.cwd },
      300000, // 5 minute timeout for builds/deploys
    );

    // Add warning for production deploys
    let content = this.formatOutput(result, command);
    if (command === 'deploy' && flags?.includes('--prod')) {
      content = `WARNING: Deployed to PRODUCTION environment.\n\n${content}`;
    }

    return {
      content,
      isError: result.isError,
      metadata: { exitCode: result.exitCode },
    };
  }

  getInstallInstructions(): string {
    return `To install Netlify CLI:

npm (global):
  npm install netlify-cli -g

npm (local dev dependency):
  npm install netlify-cli --save-dev

Then run commands with npx:
  npx netlify deploy

See https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/ for more details.`;
  }
}
