# omni-code — Setup, Deployment & Usage Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [API Key Configuration](#api-key-configuration)
4. [Running omni-code](#running-omni-code)
5. [Switching Models](#switching-models)
6. [Local Model Setup (Ollama / LM Studio / vLLM)](#local-model-setup)
7. [Configuration Reference](#configuration-reference)
8. [Slash Commands](#slash-commands)
9. [Built-in Tools](#built-in-tools)
10. [Permission Modes](#permission-modes)
11. [MCP Server Integration](#mcp-server-integration)
12. [Hooks](#hooks)
13. [Session Management](#session-management)
14. [Memory System](#memory-system)
15. [Project Context (OMNICODE.md)](#project-context)
16. [Non-Interactive Mode](#non-interactive-mode)
17. [Publishing / Global Install](#publishing--global-install)
18. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js 20+** — Required. Check with `node --version`.
- **npm 9+** — Comes with Node.js.
- **Git** — For git integration features.
- **ripgrep (rg)** — Optional but recommended for faster Grep searches. Install with `brew install ripgrep` (macOS) or `apt install ripgrep` (Linux).

---

## Installation

### From Source (Development)

```bash
cd /Users/dannybannister/Documents/Repos/omni-code

# Install dependencies
npm install

# Build the project
npm run build

# Verify it works
npm run dev -- --help
```

### Global Install (from source)

```bash
cd /Users/dannybannister/Documents/Repos/omni-code
npm run build
npm link
```

Now you can run `omni-code` or `oc` from anywhere.

### Global Install (from npm — after publishing)

```bash
npm install -g omni-code
```

---

## API Key Configuration

omni-code supports 7 LLM providers. You need at least **one** API key configured.

### Option 1: Environment Variables (Recommended)

Add these to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
# Anthropic (Claude models)
export ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI (GPT models)
export OPENAI_API_KEY="sk-..."

# Google (Gemini models)
export GOOGLE_API_KEY="AIza..."

# Mistral
export MISTRAL_API_KEY="..."

# Groq (fast inference)
export GROQ_API_KEY="gsk_..."

# xAI (Grok models)
export XAI_API_KEY="xai-..."
```

After editing, reload your shell: `source ~/.zshrc`

### Option 2: Config File

Create `~/.omnicode/config.json`:

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-..."
    },
    "openai": {
      "apiKey": "sk-..."
    },
    "xai": {
      "apiKey": "xai-..."
    }
  }
}
```

### Option 3: CLI Flag (per-session)

```bash
omni-code --api-key "sk-ant-..." --provider anthropic
```

### Where to Get API Keys

| Provider | URL | Models |
|----------|-----|--------|
| Anthropic | https://console.anthropic.com/settings/keys | Claude Opus 4.6, Sonnet 4.5, Haiku 3.5 |
| OpenAI | https://platform.openai.com/api-keys | GPT-4o, GPT-4o Mini, o3, o3-mini |
| Google | https://aistudio.google.com/apikey | Gemini 2.0 Pro, Gemini 2.0 Flash |
| Mistral | https://console.mistral.ai/api-keys | Mistral Large, Codestral |
| Groq | https://console.groq.com/keys | Llama 3.3 70B, Mixtral 8x7B |
| xAI | https://console.x.ai/ | Grok-3, Grok-3 Mini, Grok-2 |

---

## Running omni-code

### Interactive Mode (default)

```bash
# Using npm (development)
npm run dev

# Using the built binary
node bin/omni-code.mjs

# If globally installed
omni-code
# or the shorthand alias
oc
```

This opens the interactive REPL where you can type messages and get streaming responses.

### With a Specific Model

```bash
omni-code --model gpt-4o
omni-code --model grok-3
omni-code --model claude-opus-4-6
omni-code --model gemini-pro
omni-code -m llama-70b          # Groq
```

### With a Specific Provider

```bash
omni-code --provider openai
omni-code -p xai
```

---

## Switching Models

You can switch models at any time during a session using the `/model` command:

```
/model                    # List all available models
/model gpt-4o             # Switch to GPT-4o
/model grok-3             # Switch to Grok-3
/model opus               # Switch to Claude Opus 4.6 (alias)
/model sonnet             # Switch to Claude Sonnet 4.5 (alias)
/model gemini-flash       # Switch to Gemini 2.0 Flash (alias)
/model codestral          # Switch to Codestral (alias)
/model llama-70b          # Switch to Llama 3.3 70B on Groq (alias)
/model ollama/llama3      # Switch to local Llama 3 via Ollama
```

### Available Model Aliases

| Alias | Model ID | Provider |
|-------|----------|----------|
| `opus`, `claude-opus` | claude-opus-4-6 | Anthropic |
| `sonnet`, `claude-sonnet` | claude-sonnet-4-5 | Anthropic |
| `haiku`, `claude-haiku` | claude-haiku-3-5 | Anthropic |
| `4o` | gpt-4o | OpenAI |
| `4o-mini` | gpt-4o-mini | OpenAI |
| `o3-reasoning` | o3 | OpenAI |
| `gemini-pro`, `gemini` | gemini-2.0-pro | Google |
| `gemini-flash`, `flash` | gemini-2.0-flash | Google |
| `mistral-large`, `mistral` | mistral-large-latest | Mistral |
| `codestral` | codestral-latest | Mistral |
| `llama-70b`, `groq-llama` | llama-3.3-70b-versatile | Groq |
| `mixtral`, `groq-mixtral` | mixtral-8x7b-32768 | Groq |
| `grok`, `grok3` | grok-3 | xAI |
| `grok-mini`, `grok3-mini` | grok-3-mini | xAI |
| `grok2` | grok-2 | xAI |

---

## Local Model Setup

### Ollama

1. Install Ollama: https://ollama.com/download
2. Pull a model:
   ```bash
   ollama pull llama3
   ollama pull codellama
   ollama pull mistral
   ```
3. Ollama runs on `http://localhost:11434` by default.
4. Configure omni-code — add to `~/.omnicode/config.json`:
   ```json
   {
     "customEndpoints": {
       "ollama": {
         "baseUrl": "http://localhost:11434/v1",
         "models": ["llama3", "codellama", "mistral"]
       }
     }
   }
   ```
5. Use it:
   ```
   /model ollama/llama3
   ```

### LM Studio

1. Download LM Studio: https://lmstudio.ai/
2. Load a model and start the local server (default port: 1234).
3. Configure omni-code:
   ```json
   {
     "customEndpoints": {
       "lmstudio": {
         "baseUrl": "http://localhost:1234/v1",
         "models": ["local-model"]
       }
     }
   }
   ```
4. Use it:
   ```
   /model lmstudio/local-model
   ```

### vLLM

1. Start vLLM with OpenAI-compatible server:
   ```bash
   python -m vllm.entrypoints.openai.api_server --model meta-llama/Llama-3-8b-instruct --port 8000
   ```
2. Configure:
   ```json
   {
     "customEndpoints": {
       "vllm": {
         "baseUrl": "http://localhost:8000/v1",
         "models": ["meta-llama/Llama-3-8b-instruct"]
       }
     }
   }
   ```

### Any OpenAI-Compatible API

Any service that exposes an OpenAI-compatible `/v1/chat/completions` endpoint works. Just set the `baseUrl` and optionally `apiKey`.

---

## Configuration Reference

omni-code loads configuration from multiple sources, with higher-priority sources overriding lower ones:

1. **CLI flags** (highest priority)
2. **Environment variables**
3. **Project config** — `.omnicode/config.json` in your project root
4. **User config** — `~/.omnicode/config.json`
5. **Defaults** (lowest priority)

### Full Config Schema

```json
{
  "defaultProvider": "anthropic",
  "defaultModel": "claude-sonnet-4-5",
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-...",
      "maxRetries": 3,
      "timeout": 60000
    },
    "openai": {
      "apiKey": "sk-...",
      "organizationId": "org-..."
    },
    "google": { "apiKey": "..." },
    "mistral": { "apiKey": "..." },
    "groq": { "apiKey": "..." },
    "xai": { "apiKey": "..." }
  },
  "permissionMode": "ask",
  "disabledTools": [],
  "mcpServers": {},
  "hooks": {
    "preToolCall": [],
    "postToolCall": []
  },
  "systemPromptAppend": "",
  "sessionPersistence": true,
  "maxContextTokens": 100000,
  "temperature": 0.7,
  "theme": "auto",
  "logLevel": "info",
  "customEndpoints": {}
}
```

### Environment Variables

| Variable | Maps To |
|----------|---------|
| `ANTHROPIC_API_KEY` | providers.anthropic.apiKey |
| `OPENAI_API_KEY` | providers.openai.apiKey |
| `GOOGLE_API_KEY` | providers.google.apiKey |
| `MISTRAL_API_KEY` | providers.mistral.apiKey |
| `GROQ_API_KEY` | providers.groq.apiKey |
| `XAI_API_KEY` | providers.xai.apiKey |
| `OMNICODE_MODEL` | defaultModel |
| `OMNICODE_PROVIDER` | defaultProvider |
| `OMNICODE_PERMISSION_MODE` | permissionMode |

---

## Slash Commands

Type these at the input prompt:

| Command | Aliases | Description |
|---------|---------|-------------|
| `/help` | `/h` | Show available commands |
| `/model [name]` | `/m` | Switch model or list available models |
| `/providers` | `/p` | List configured providers and their status |
| `/cost` | | Show session token usage and estimated cost |
| `/compact` | | Compress conversation context to free tokens |
| `/clear` | `/c` | Clear conversation history |
| `/exit` | Ctrl+C | Exit omni-code |

---

## Built-in Tools

The AI assistant has access to these tools:

| Tool | What It Does | Permission |
|------|-------------|------------|
| **Read** | Read files with line numbers | Safe (always allowed) |
| **Write** | Create or overwrite files | Dangerous (always prompts) |
| **Edit** | Exact string replacement in files | Moderate |
| **Glob** | Find files by pattern (e.g., `**/*.ts`) | Safe |
| **Grep** | Search file contents with regex | Safe |
| **Bash** | Execute shell commands | Moderate |

Tools from MCP servers are also available and appear with the `mcp__` prefix.

---

## Permission Modes

Control how tool calls are approved:

| Mode | Behavior |
|------|----------|
| `ask` (default) | Prompts for approval on Moderate/Dangerous tools. Safe tools auto-allowed. |
| `auto-allow` | All tools auto-allowed. No prompts. Use with caution. |
| `deny-all` | Only Safe (read-only) tools allowed. Everything else denied. |

Set via config, environment variable, or CLI flag:

```bash
# Via CLI
omni-code --permission-mode auto-allow

# Via environment
export OMNICODE_PERMISSION_MODE=auto-allow

# Via config
{ "permissionMode": "auto-allow" }
```

When prompted for permission:
- **y** — Allow this one time
- **n** — Deny this one time
- **a** — Always allow this tool for the rest of the session

---

## MCP Server Integration

omni-code supports the Model Context Protocol for extending its tool set.

### Configuration

Add MCP servers to your config:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"],
      "transport": "stdio"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
      },
      "transport": "stdio"
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"],
      "transport": "stdio"
    }
  }
}
```

MCP tools are automatically discovered on startup and appear with the naming pattern:
`mcp__<server-name>__<tool-name>`

---

## Hooks

Hooks let you run shell commands before or after tool calls.

### Configuration

```json
{
  "hooks": {
    "preToolCall": [
      {
        "tool": "Bash",
        "command": "echo 'Running command: $OMNICODE_INPUT' >> /tmp/omnicode.log"
      }
    ],
    "postToolCall": [
      {
        "tool": "Write",
        "command": "echo 'File written: $OMNICODE_INPUT' >> /tmp/omnicode.log"
      },
      {
        "tool": "*",
        "command": "if [ \"$OMNICODE_IS_ERROR\" = 'true' ]; then echo 'TOOL ERROR' >> /tmp/errors.log; fi"
      }
    ]
  }
}
```

### Available Environment Variables in Hooks

| Variable | Available In | Description |
|----------|-------------|-------------|
| `OMNICODE_TOOL` | pre, post | Tool name (e.g., "Bash", "Write") |
| `OMNICODE_INPUT` | pre, post | JSON-encoded tool input |
| `OMNICODE_HOOK_TYPE` | pre, post | "pre" or "post" |
| `OMNICODE_CWD` | pre, post | Current working directory |
| `OMNICODE_RESULT` | post only | Tool output (truncated to 10KB) |
| `OMNICODE_IS_ERROR` | post only | "true" or "false" |

The `tool` field supports glob patterns: `"*"` matches all tools, `"Write"` matches only Write, etc.

---

## Session Management

Sessions are automatically saved to `~/.omnicode/sessions.db` (SQLite).

Each session stores:
- Full conversation history
- Model and provider used
- Working directory
- Token usage and cost metadata

Sessions can be resumed in future versions via the `/resume` command.

---

## Memory System

omni-code has a persistent memory system stored in `~/.omnicode/memory.db`.

Memories are categorized as:
- **fact** — Things learned about the codebase or project
- **preference** — User preferences and conventions
- **instruction** — Standing instructions (e.g., "always use bun")
- **context** — Project-specific context

Memories persist across sessions and can be managed via the `/memory` command.

---

## Project Context (OMNICODE.md)

Similar to how Claude Code uses `CLAUDE.md`, omni-code loads project context from `OMNICODE.md` files.

### File Locations (loaded in order, all concatenated)

1. `~/.omnicode/OMNICODE.md` — Global context (applies to all projects)
2. Parent directory `OMNICODE.md` files (for monorepo support)
3. `./OMNICODE.md` — Project root
4. `./.omnicode/OMNICODE.md` — Project root (alternative location)

### Example OMNICODE.md

```markdown
# Project Context

This is a TypeScript monorepo using pnpm workspaces.

## Conventions
- Use `bun` instead of `npm` for running scripts
- Tests use vitest
- Follow the existing code style (no semicolons, single quotes)
- Always run `bun test` after making changes

## Architecture
- Frontend: React + Vite in packages/web
- Backend: Hono + Drizzle in packages/api
- Shared types in packages/shared
```

---

## Non-Interactive Mode

Run a single prompt and exit:

```bash
# Pass prompt as argument
omni-code "explain what this project does"

# Pipe input
echo "list all TypeScript files" | omni-code

# Use with a specific model
omni-code --model grok-3 "write a function to sort an array"
```

In non-interactive mode, the response streams to stdout and the cost summary is printed at the end.

---

## Publishing / Global Install

### Build for Distribution

```bash
cd /Users/dannybannister/Documents/Repos/omni-code
npm run build
```

This produces:
- `dist/index.js` — Bundled ESM module (~110KB)
- `bin/omni-code.mjs` — Entry point shim

### Install Globally from Source

```bash
npm link
```

Now `omni-code` and `oc` are available system-wide.

### Publish to npm

```bash
# Update version in package.json
npm version patch  # or minor/major

# Publish
npm publish
```

Users can then install with:
```bash
npm install -g omni-code
```

Or run without installing:
```bash
npx omni-code "your prompt here"
```

---

## Troubleshooting

### "Provider X is not available"

The API key for that provider is not set. Check:
```bash
echo $ANTHROPIC_API_KEY    # Should print your key
echo $OPENAI_API_KEY
echo $XAI_API_KEY
```

Or check `~/.omnicode/config.json` has the key under `providers.<name>.apiKey`.

### "Unknown model: X"

Run `/model` to see all available models and their aliases. The model name must match exactly or be a recognized alias.

### Ollama connection refused

Make sure Ollama is running:
```bash
ollama serve
```

And that the `baseUrl` in your config matches (default: `http://localhost:11434/v1`).

### Tool permission always prompting

Set permission mode to auto-allow:
```bash
omni-code --permission-mode auto-allow
```

Or set it in config:
```json
{ "permissionMode": "auto-allow" }
```

### Context too long / running out of tokens

Use `/compact` to compress the conversation. This summarizes older messages and keeps recent ones.

Or set a lower `maxContextTokens` in config to trigger auto-compression earlier.

### Build errors

Make sure you're on Node.js 20+:
```bash
node --version  # Should be v20.x or higher
```

Rebuild native dependencies:
```bash
npm rebuild better-sqlite3
```

### TypeScript errors during development

```bash
# Full type check
npm run typecheck

# Dev mode with hot reload
npm run dev
```

---

## Directory Structure

```
omni-code/
├── bin/omni-code.mjs           # CLI entry point
├── dist/                       # Built output
├── src/
│   ├── index.ts                # Bootstrap: init providers, tools, UI
│   ├── cli.ts                  # CLI argument parser
│   ├── constants.ts            # App-wide constants
│   ├── core/                   # Agent loop, message types, cost tracking
│   ├── providers/              # 7 LLM provider adapters
│   │   ├── anthropic/          # Claude
│   │   ├── openai/             # GPT
│   │   ├── google/             # Gemini
│   │   ├── mistral/            # Mistral / Codestral
│   │   ├── groq/               # Groq (Llama, Mixtral)
│   │   ├── xai/                # Grok
│   │   └── openai-compatible/  # Ollama, LM Studio, vLLM
│   ├── tools/                  # Tool system + 6 built-in tools
│   ├── permissions/            # Permission manager
│   ├── commands/               # Slash commands
│   ├── ui/components/          # Ink (React) terminal UI
│   ├── config/                 # Configuration system
│   ├── session/                # SQLite session persistence
│   ├── memory/                 # Persistent memory + OMNICODE.md loader
│   ├── mcp/                    # MCP server client + tool bridge
│   ├── hooks/                  # Pre/post tool call hooks
│   ├── git/                    # Git operations wrapper
│   └── utils/                  # Logger, event bus, retry, rate limiter
├── tests/                      # Test directory
├── docs/                       # Documentation
├── package.json
├── tsconfig.json
└── tsup.config.ts
```
