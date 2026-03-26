import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import { GitManager } from '../../git/git-manager.js';

export class CodeReviewTool implements Tool {
  readonly name = 'CodeReview';
  readonly description = `Gather git diff for code review analysis. Returns the diff formatted with review guidelines for systematic review of changes for bugs, security issues, style, and improvements.`;
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.READ;

  readonly inputSchema = {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        enum: ['staged', 'unstaged', 'branch'],
        description: 'What to review: staged changes, unstaged changes, or branch diff (default: unstaged)',
      },
      branch: {
        type: 'string',
        description: 'Branch to compare against (for target="branch", e.g., "main")',
      },
      file: {
        type: 'string',
        description: 'Review changes for a specific file only',
      },
    },
    required: [],
  };

  validate(input: Record<string, unknown>): string | null {
    if (input.target === 'branch' && !input.branch) return 'branch is required when target is "branch"';
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const target = (input.target as string) || 'unstaged';
    const branch = input.branch as string | undefined;
    const file = input.file as string | undefined;

    try {
      const git = new GitManager(context.cwd);
      if (!await git.isRepo()) return { content: 'Not a git repository', isError: true };

      let diff: string;
      if (target === 'branch' && branch) {
        diff = await git.diffRange(`${branch}...HEAD`);
      } else {
        diff = await git.diff(target === 'staged');
      }

      if (file) {
        const lines = diff.split('\n');
        const filtered: string[] = [];
        let inFile = false;
        for (const line of lines) {
          if (line.startsWith('diff --git')) inFile = line.includes(file);
          if (inFile) filtered.push(line);
        }
        diff = filtered.join('\n');
      }

      if (!diff.trim()) return { content: 'No changes to review.' };

      const status = await git.status();
      const reviewPrompt = `## Code Review

### Repository Status
${status}

### Changes to Review
\`\`\`diff
${diff}
\`\`\`

### Review Checklist
Please analyze the diff above for:
1. **Correctness**: Logic errors, off-by-one, null/undefined handling
2. **Security**: Injection vulnerabilities, data exposure, auth issues
3. **Performance**: N+1 queries, unnecessary allocations, blocking operations
4. **Style**: Naming conventions, code organization, consistency
5. **Edge cases**: Error handling, boundary conditions, empty inputs
6. **Testing**: Are the changes covered by tests?`;

      return { content: reviewPrompt };
    } catch (error) {
      return { content: `Code review error: ${(error as Error).message}`, isError: true };
    }
  }
}
