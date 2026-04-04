---
name: Create Rule
description: Create a new .omnicode rule for persistent AI guidance in this project
---

# Create Rule Skill

Use this skill when the user wants to create a new project rule to give the AI persistent instructions.

## When to Use
- User asks to "add a rule", "create a rule", or "remember this for future conversations"
- User describes a coding standard, convention, or pattern they always want followed
- User wants to enforce project-specific constraints on the AI's behavior

## Steps

1. **Understand the rule** — Ask the user what the rule should enforce or teach. Get the key constraints or instructions.

2. **Determine scope** — Ask: "Should this rule always apply, or only when working with specific files?" (e.g. `**/*.tsx` for React components only)

3. **Create the `.mdc` file** in `.omnicode/rules/` using the Write tool:

```
---
description: Brief description shown in the rules list
globs: **/*.ts          # optional: only apply to these files
alwaysApply: true       # optional: always inject into system prompt
---

# Rule Title

Rule content here — be specific and actionable.

## Guidelines
- Specific constraint or pattern
- Another constraint

## Examples
Bad:
\`\`\`typescript
// example of what NOT to do
\`\`\`

Good:
\`\`\`typescript
// example of the correct approach
\`\`\`
```

4. **Confirm** — Tell the user the rule has been created at `.omnicode/rules/<rule-id>.mdc` and will be active for future conversations.

## Notes
- Rule files use YAML frontmatter + Markdown
- Keep rules under 500 lines — focused and actionable
- Rules with `alwaysApply: true` are injected into every conversation system prompt
- Rules with `globs` are injected when matching files are open in the editor
- Rules with only `description` are listed in the system prompt; the AI applies them contextually
