import simpleGit, { type SimpleGit } from 'simple-git';

export class GitManager {
  private git: SimpleGit;

  constructor(cwd: string) {
    this.git = simpleGit(cwd);
  }

  async isRepo(): Promise<boolean> {
    try {
      await this.git.revparse(['--is-inside-work-tree']);
      return true;
    } catch {
      return false;
    }
  }

  async status(): Promise<string> {
    const status = await this.git.status();
    const lines: string[] = [];
    lines.push(`Branch: ${status.current}`);
    if (status.ahead) lines.push(`Ahead: ${status.ahead}`);
    if (status.behind) lines.push(`Behind: ${status.behind}`);
    if (status.staged.length) lines.push(`Staged: ${status.staged.join(', ')}`);
    if (status.modified.length) lines.push(`Modified: ${status.modified.join(', ')}`);
    if (status.not_added.length) lines.push(`Untracked: ${status.not_added.join(', ')}`);
    if (status.conflicted.length) lines.push(`Conflicted: ${status.conflicted.join(', ')}`);
    return lines.join('\n');
  }

  async diff(staged = false): Promise<string> {
    if (staged) {
      return this.git.diff(['--staged']);
    }
    return this.git.diff();
  }

  async log(maxCount = 10, oneline = false, file?: string): Promise<string> {
    const options: Record<string, any> = { maxCount };
    if (file) options.file = file;
    const log = await this.git.log(options);
    if (oneline) {
      return log.all.map(c => `${c.hash.substring(0, 7)} ${c.message}`).join('\n');
    }
    return log.all.map(c => `${c.hash.substring(0, 7)} ${c.message} (${c.author_name})`).join('\n');
  }

  async add(files: string[]): Promise<void> {
    await this.git.add(files);
  }

  async commit(message: string): Promise<string> {
    const result = await this.git.commit(message);
    return result.commit;
  }

  async currentBranch(): Promise<string> {
    const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
    return branch.trim();
  }

  async createBranch(name: string): Promise<void> {
    await this.git.checkoutLocalBranch(name);
  }

  async push(remote = 'origin', branch?: string): Promise<void> {
    const currentBranch = branch || await this.currentBranch();
    await this.git.push(remote, currentBranch, ['--set-upstream']);
  }

  async diffRange(range: string): Promise<string> {
    return this.git.diff([range]);
  }

  async listBranches(): Promise<string[]> {
    const result = await this.git.branchLocal();
    return result.all;
  }

  async switchBranch(name: string): Promise<void> {
    await this.git.checkout(name);
  }

  async deleteBranch(name: string): Promise<void> {
    await this.git.deleteLocalBranch(name);
  }

  async stash(action: string, message?: string, index = 0): Promise<string> {
    switch (action) {
      case 'push': {
        const args = message ? ['push', '-m', message] : ['push'];
        return this.git.stash(args);
      }
      case 'pop':
        return this.git.stash(['pop', `stash@{${index}}`]);
      case 'apply':
        return this.git.stash(['apply', `stash@{${index}}`]);
      case 'drop':
        return this.git.stash(['drop', `stash@{${index}}`]);
      case 'list':
        return this.git.stash(['list']);
      default:
        throw new Error(`Unknown stash action: ${action}`);
    }
  }
}
