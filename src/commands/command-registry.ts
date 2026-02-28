import type { SlashCommand, CommandContext } from './command-types.js';

export class CommandRegistry {
  private commands = new Map<string, SlashCommand>();

  register(command: SlashCommand): void {
    this.commands.set(command.name, command);
    for (const alias of command.aliases || []) {
      this.commands.set(alias, command);
    }
  }

  async execute(input: string, context: CommandContext): Promise<string | void> {
    const [commandName, ...argParts] = input.slice(1).split(/\s+/);
    const args = argParts.join(' ');

    const command = this.commands.get(commandName);
    if (!command) {
      return `Unknown command: /${commandName}. Type /help for available commands.`;
    }
    return command.execute(args, context);
  }

  isCommand(input: string): boolean {
    return input.startsWith('/');
  }

  getAll(): SlashCommand[] {
    return [...new Set(this.commands.values())];
  }
}
