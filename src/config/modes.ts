export interface ModeConfig {
  systemPromptAppend: string;
  allowedTools?: string[];
  disabledTools?: string[];
  temperature?: number;
  planMode?: boolean;
}

export const BUILTIN_MODES: Record<string, ModeConfig> = {
  architect: {
    systemPromptAppend: `You are in architect mode. Focus on high-level design, planning, and code review. Prefer reading and analysis over writing code. Suggest implementation strategies without modifying files directly.

PLAN MANAGEMENT:
When creating a plan:
1. Use CreatePlan tool to generate PLAN.md with markdown checkboxes for all tasks
2. Structure tasks in logical phases/sections (e.g., "Phase 1: Setup", "Phase 2: Implementation")
3. Each task should be specific and actionable
4. Include an Overview section explaining the approach

When reviewing/updating:
1. Use ReadPlan to check current status
2. Use UpdatePlan to mark items complete or add new tasks
3. Keep the plan current with implementation progress

The PLAN.md serves as the single source of truth for the project roadmap.`,
    disabledTools: ['Write', 'Edit', 'MultiFileEdit', 'DiffEdit', 'Bash', 'GitCommit'],
    planMode: true,
  },
  code: {
    systemPromptAppend: `You are in coding mode. Focus on implementing changes efficiently. Write clean, well-structured code. Test when possible.

PLAN REFERENCE:
When working on a task:
1. Check if PLAN.md exists using ReadPlan tool
2. Reference the plan for context on current task and overall progress
3. After completing work, use UpdatePlan to check off relevant items
4. Add implementation notes to the plan if decisions were made

Do NOT create new plans in code mode - only reference or update existing plans.`,
    temperature: 0.3,
  },
  review: {
    systemPromptAppend: 'You are in code review mode. Analyze code for bugs, security issues, performance problems, and style. Provide specific, actionable feedback. Do not make changes.',
    disabledTools: ['Write', 'Edit', 'MultiFileEdit', 'DiffEdit', 'Bash', 'GitCommit'],
    planMode: true,
  },
  security: {
    systemPromptAppend: 'You are in security audit mode. Focus exclusively on identifying security vulnerabilities: injection flaws, authentication issues, data exposure, misconfigurations. Report findings with severity ratings.',
    disabledTools: ['Write', 'Edit', 'MultiFileEdit', 'DiffEdit', 'Bash', 'GitCommit'],
    planMode: true,
  },
  debug: {
    systemPromptAppend: 'You are in debug mode. Focus on diagnosing issues: read logs, trace code paths, inspect state, run targeted tests. Be methodical and systematic.',
    temperature: 0.2,
  },
};
