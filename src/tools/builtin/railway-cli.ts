import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { PlatformCLIManager } from './platform-cli-manager.js';

export class RailwayTool extends PlatformCLIManager implements Tool {
  readonly name = 'Railway';
  readonly description = 'Execute Railway CLI commands for deployment, environment variables, and service management. WARNING: up command deploys to production. Use down to stop services.';
  readonly permissionLevel = PermissionLevel.DANGEROUS;
  readonly category = ToolCategory.EXECUTE;
  readonly availableInPlanMode = false;

  protected cliName = 'Railway';
  protected cliCommand = 'railway';

  readonly inputSchema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        enum: [
          'init',
          'link',
          'up',
          'down',
          'run',
          'logs',
          'status',
          'open',
          'variable list',
          'variable get',
          'variable set',
          'variable unset',
          'variable import',
          'environment',
          'environment new',
          'environment delete',
          'service',
          'add',
          'domain',
          'volume',
          'list',
          'login',
          'logout',
          'unlink',
          'whoami',
          'ssh',
          'shell',
          'connect',
        ],
        description: 'The Railway CLI command to execute. DANGER: up command deploys current directory to production. down stops the service.',
      },
      service: {
        type: 'string',
        description: 'Target service name or ID (-s flag)',
      },
      environment: {
        type: 'string',
        description: 'Target environment name (-e flag)',
      },
      flags: {
        type: 'array',
        items: { type: 'string' },
        description: 'CLI flags like --detach (no logs), --yes (skip confirm), --verbose, etc.',
      },
      key: {
        type: 'string',
        description: 'Variable key for variable commands',
      },
      value: {
        type: 'string',
        description: 'Variable value for variable set command',
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

    // variable set requires key and value
    if (input.command === 'variable set') {
      if (!input.key || typeof input.key !== 'string') {
        return 'variable set command requires a "key" parameter';
      }
      if (!input.value || typeof input.value !== 'string') {
        return 'variable set command requires a "value" parameter';
      }
    }

    // variable get and variable unset require key
    if (['variable get', 'variable unset'].includes(input.command)) {
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
        content: `Railway CLI is not installed.\n\n${this.getInstallInstructions()}`,
        isError: true,
      };
    }

    const command = input.command as string;
    const args: string[] = [];

    // Add service flag if provided
    if (input.service) {
      args.push('-s', input.service as string);
    }

    // Add environment flag if provided
    if (input.environment) {
      args.push('-e', input.environment as string);
    }

    // Add flags
    const flags = input.flags as string[] | undefined;
    if (flags) {
      args.push(...flags);
    }

    // Parse composite commands like "variable list", "environment new"
    const [mainCmd, subCmd] = command.split(' ');

    // Handle variable set with key=value
    if (command === 'variable set' && input.key && input.value) {
      args.push(input.key as string, input.value as string);
    }

    // Handle variable get/unset with key
    if ((command === 'variable get' || command === 'variable unset') && input.key) {
      args.push(input.key as string);
    }

    const result = await this.executeCommand(
      mainCmd,
      subCmd ? [subCmd, ...args] : args,
      { cwd: context.cwd },
      300000, // 5 minute timeout for deploys
    );

    // Add warning for production deploys
    let content = this.formatOutput(result, command);
    if (command === 'up') {
      content = `WARNING: Deployed to Railway production environment.\n\n${content}`;
    }

    if (command === 'down') {
      content = `WARNING: Stopped Railway service.\n\n${content}`;
    }

    return {
      content,
      isError: result.isError,
      metadata: { exitCode: result.exitCode },
    };
  }

  getInstallInstructions(): string {
    return `To install Railway CLI:

npm (global):
  npm i -g @railway/cli

Homebrew (macOS):
  brew install railway

Shell script (macOS/Linux):
  bash <(curl -fsSL cli.new)

Scoop (Windows):
  scoop install railway

Pre-built binaries:
  https://github.com/railwayapp/cli/releases/latest

See https://docs.railway.com/cli for more details.`;
  }
}
