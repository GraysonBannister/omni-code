import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

/**
 * AskUserTool - Pauses chat execution to prompt the user for input or action.
 * Similar to the permission system, this tool emits an event and waits for user response.
 */
export class AskUserTool implements Tool {
  readonly name = 'AskUser';
  readonly description = 'Pause the conversation to ask the user a question or prompt them to perform an action in their terminal. The AI will wait for the user to respond before continuing. Useful for interactive authentication, terminal commands that require user interaction, or getting user input.';
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.AGENT;

  readonly inputSchema = {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'The message/prompt to show the user explaining what action to take or question to answer',
      },
      terminalCommand: {
        type: 'string',
        description: 'Optional: A specific terminal command the user should run (e.g., "supabase login"). This will be shown prominently in the UI.',
      },
      waitForInput: {
        type: 'boolean',
        description: 'If true, show a text input field for the user to type a response. If false (default), just show a "Done" button for the user to click when ready.',
      },
      placeholder: {
        type: 'string',
        description: 'Optional placeholder text for the input field (only used if waitForInput is true)',
      },
    },
    required: ['prompt'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.prompt !== 'string' || !input.prompt.trim()) {
      return 'prompt must be a non-empty string';
    }
    if (input.terminalCommand !== undefined && typeof input.terminalCommand !== 'string') {
      return 'terminalCommand must be a string';
    }
    if (input.waitForInput !== undefined && typeof input.waitForInput !== 'boolean') {
      return 'waitForInput must be a boolean';
    }
    if (input.placeholder !== undefined && typeof input.placeholder !== 'string') {
      return 'placeholder must be a string';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const prompt = input.prompt as string;
    const terminalCommand = input.terminalCommand as string | undefined;
    const waitForInput = (input.waitForInput as boolean) ?? false;
    const placeholder = input.placeholder as string | undefined;

    return new Promise((resolve) => {
      // Emit event to request user input
      // The UI layer will listen for this event and show a modal/prompt
      const ctx = context as ToolContext & { eventBus?: { emit: (event: string, data: unknown) => void } };
      const eventBus = ctx.eventBus;

      if (!eventBus) {
        resolve({
          content: 'Error: EventBus not available in tool context.',
          isError: true,
        });
        return;
      }

      const requestId = `${context.sessionId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      eventBus.emit('user_input_request', {
        sessionId: context.sessionId,
        requestId,
        prompt,
        terminalCommand,
        waitForInput,
        placeholder,
        onResponse: (response: string) => {
          let content = `User responded to: "${prompt}"\n\n`;

          if (terminalCommand) {
            content += `Terminal command provided: \`${terminalCommand}\`\n\n`;
          }

          if (response) {
            content += `Response: ${response}`;
          } else {
            content += 'User confirmed completion (no text input provided).';
          }

          resolve({
            content,
            metadata: { response, hadInput: waitForInput },
          });
        },
        onCancel: () => {
          resolve({
            content: `User cancelled the request: "${prompt}"`,
            isError: true,
            metadata: { cancelled: true },
          });
        },
      });
    });
  }
}
