import { spawn } from 'node:child_process';
import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { PlatformCLIManager } from './platform-cli-manager.js';

export class SupabaseTool extends PlatformCLIManager implements Tool {
  readonly name = 'Supabase';
  readonly description = 'Execute Supabase CLI commands for local development, database management, and deployment. Supports init, start, stop, db operations, functions, and more. NOTE: login/logout require manual terminal use. Docker is required for local stack commands.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.EXECUTE;

  protected cliName = 'Supabase';
  protected cliCommand = 'supabase';

  // Commands that require Docker daemon to be running
  private readonly dockerCommands = [
    'start', 'stop', 'status', 'db reset', 'db push', 'db pull',
    'db dump', 'db restore', 'seed', 'migration up', 'migration repair',
    'functions deploy',
  ];

  // Commands that require interactive TTY (cannot run in non-TTY environment)
  private readonly interactiveCommands = ['login', 'logout'];

  readonly inputSchema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        enum: [
          'init',
          'start',
          'stop',
          'status',
          'db reset',
          'db push',
          'db pull',
          'db dump',
          'db restore',
          'functions deploy',
          'functions new',
          'migration new',
          'migration up',
          'migration repair',
          'seed',
          'link',
          'unlink',
          'list',
          'login',
          'logout',
          'gen types',
        ],
        description: 'The Supabase CLI command to execute. Common commands: init (create new project), start (launch local stack), stop (stop local stack), db push (push migrations), functions deploy (deploy edge functions), link (link to hosted project). NOTE: login/logout require manual terminal use.',
      },
      projectId: {
        type: 'string',
        description: 'Project reference ID for link/unlink or remote commands. REQUIRED for link command.',
      },
      name: {
        type: 'string',
        description: 'Name for new resources (function, migration, etc.)',
      },
      flags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Additional CLI flags like --debug, --experimental, --db-url, etc.',
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

    // Some commands require a name parameter
    const requiresName = ['functions new', 'migration new'];
    if (requiresName.includes(input.command) && !input.name) {
      return `command "${input.command}" requires a "name" parameter`;
    }

    // Link command requires projectId
    if (input.command === 'link' && !input.projectId) {
      return 'command "link" requires a "projectId" parameter (the project reference ID from your Supabase dashboard)';
    }

    // Unlink may also need projectId if multiple projects are linked
    if (input.command === 'unlink' && !input.projectId) {
      return 'command "unlink" requires a "projectId" parameter to specify which project to unlink';
    }

    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const installed = await this.isCLIInstalled();
    if (!installed) {
      return {
        content: `Supabase CLI is not installed.\n\n${this.getInstallInstructions()}`,
        isError: true,
      };
    }

    const command = input.command as string;

    // Handle interactive commands that require TTY
    if (this.interactiveCommands.includes(command)) {
      return {
        content: `Command "${command}" requires an interactive terminal and cannot run in this environment.\n\nPlease run manually in your terminal:\n  supabase ${command}\n\nAlternative authentication methods:\n1. Use --token flag: supabase ${command} --token <your-access-token>\n2. Set environment variable: SUPABASE_ACCESS_TOKEN=<token> supabase ${command}\n\nYou can get your access token from https://supabase.com/dashboard/account/tokens`,
        isError: true,
      };
    }

    // Check Docker for commands that need it
    if (this.dockerCommands.includes(command)) {
      const dockerRunning = await this.isDockerRunning();
      if (!dockerRunning) {
        return {
          content: `Docker daemon is not running. The "${command}" command requires Docker to be active.\n\nTo fix this:\n1. Start Docker Desktop (macOS/Windows)\n2. Or run: sudo systemctl start docker (Linux)\n3. Verify with: docker ps\n\nThen try the command again.`,
          isError: true,
        };
      }
    }

    const args: string[] = [];

    // Add flags
    const flags = input.flags as string[] | undefined;
    if (flags) {
      args.push(...flags);
    }

    // Add project reference if provided
    if (input.projectId) {
      args.push('--project-ref', input.projectId as string);
    }

    // Add name for resource creation commands
    if (input.name) {
      args.push(input.name as string);
    }

    // Parse composite commands like "db reset" or "functions deploy"
    const [mainCmd, subCmd] = command.split(' ');

    const result = await this.executeCommand(
      mainCmd,
      subCmd ? [subCmd, ...args] : args,
      { cwd: context.cwd },
      300000, // 5 minute timeout for DB operations
    );

    return {
      content: this.formatOutput(result, command),
      isError: result.isError,
      metadata: { exitCode: result.exitCode },
    };
  }

  /**
   * Check if Docker daemon is running
   */
  private async isDockerRunning(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('docker', ['ps'], { stdio: 'ignore' });
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
  }

  getInstallInstructions(): string {
    return `To install Supabase CLI:

macOS (Homebrew):
  brew install supabase

npm (cross-platform):
  npm install supabase --save-dev
  # or globally: npm install -g supabase

Direct install script:
  curl -fsSL https://get.supabase.com | bash

See https://supabase.com/docs/guides/local-development/cli/getting-started for more details.`;
  }
}
