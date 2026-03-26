export interface ModeConfig {
  systemPromptAppend: string;
  allowedTools?: string[];
  disabledTools?: string[];
  temperature?: number;
}

export const BUILTIN_MODES: Record<string, ModeConfig> = {
  architect: {
    systemPromptAppend: `You are in architect mode. Focus on high-level design, planning, and code review. Prefer reading and analysis over writing code. Suggest implementation strategies without modifying files directly.`,
    disabledTools: ['Write', 'Edit', 'MultiFileEdit', 'DiffEdit', 'Bash', 'GitCommit'],
  },
  code: {
    systemPromptAppend: `You are in coding mode. Focus on implementing changes efficiently. Write clean, well-structured code.`,
    temperature: 0.3,
  },
  review: {
    systemPromptAppend: 'You are in code review mode. Analyze code for bugs, security issues, performance problems, and style. Provide specific, actionable feedback. Do not make changes.',
    disabledTools: ['Write', 'Edit', 'MultiFileEdit', 'DiffEdit', 'Bash', 'GitCommit'],
  },
  security: {
    systemPromptAppend: 'You are in security audit mode. Focus exclusively on identifying security vulnerabilities: injection flaws, authentication issues, data exposure, misconfigurations. Report findings with severity ratings.',
    disabledTools: ['Write', 'Edit', 'MultiFileEdit', 'DiffEdit', 'Bash', 'GitCommit'],
  },
  debug: {
    systemPromptAppend: 'You are in debug mode. Focus on diagnosing issues: read logs, trace code paths, inspect state, run targeted tests. Be methodical and systematic.',
    temperature: 0.2,
  },
};
