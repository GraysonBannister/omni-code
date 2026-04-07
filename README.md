# Omni Code

Omni Code is a powerful AI coding assistant that combines a multi-LLM agent system with a modern desktop interface. It supports both terminal-based and Electron desktop modes, offering flexible workflows for code generation, editing, debugging, and project management.

## Features

### Multi-Provider LLM Support
Connect to your preferred AI models from multiple providers:

- **Anthropic** - Claude Opus 4.6, Sonnet 4.5, Haiku 3.5
- **OpenAI** - GPT-5.4 series, GPT-5 series, GPT-5.1/5.2, GPT-4.1 series, GPT-4o, o1/o3 reasoning models
- **Google** - Gemini 2.0 Pro, 2.0 Flash
- **xAI** - Grok 4.x series, Grok 3.x series, Grok 2.x series
- **Mistral** - Large, Codestral
- **Groq** - Llama 3.3 70B, Mixtral 8x7B
- **Moonshot** - Kimi K2.5, K1.6, K1.6 Long Context
- **AWS Bedrock** - Claude, Llama, Mistral models
- **Custom/OpenAI-compatible** - Ollama, LM Studio, vLLM, and more

### Desktop Application
- **Electron-based UI** with React renderer
- **Multi-conversation tabs** for parallel work streams
- **File explorer** with real-time file watching
- **Code editor** with Monaco editor integration
- **Chat panel** with streaming responses and tool visualization
- **File change review** - accept or reject individual changes before they're applied

### Advanced Capabilities

#### Modes System
Switch between specialized agent modes for different tasks:
- **Code Mode** - Default coding mode with full tool access
- **Architect Mode** - Analyze and plan without writing code
- **Review Mode** - Code review and analysis without modifications
- **Security Mode** - Security-focused vulnerability detection
- **Debug Mode** - Systematic debugging and diagnostics

#### Plan Mode
Generate and execute structured execution plans:
- Create detailed plans with file-by-file breakdowns
- Interactive plan review with inline plan cards
- Step-by-step execution tracking
- Automatic progress updates as steps complete
- Pause, resume, or abort plan execution

#### Codebase Intelligence
- **Semantic search** - Find code by meaning, not just text
- **Codebase indexing** - Vector-based code understanding
- **Project context** - Automatic project structure analysis
- **Multi-file awareness** - Cross-file dependencies and relationships

#### Skills, Rules & Addons
- **Skills** - Reusable agent capabilities for common tasks
- **Rules** - Persistent coding guidelines and conventions
- **Addons** - Extend functionality with installable add-ons
- **MCP Support** - Model Context Protocol for external tool integration

#### Git Integration
- Built-in Git panel with status visualization
- Stage, unstage, commit, and push operations
- Branch management and switching
- Diff viewing for staged and unstaged changes
- File history and blame tracking

#### Development Tools
- **Built-in terminal** - Full terminal access within the app
- **Browser automation** - AI-controlled browser for testing and verification
- **Remote access** - Pair with mobile devices via QR code
- **Usage tracking** - Cost monitoring and token usage analytics

## Requirements

- Node.js 20+
- npm or yarn
- macOS, Linux, or Windows with Electron support
- API keys for desired LLM providers

## Installation

```bash
npm install
```

## Configuration

Omni Code uses a settings system for configuration:

1. **API Keys** - Set provider API keys in Settings (`Cmd/Ctrl + ,`)
2. **Permission Modes** - Choose between `always-ask`, `ask-on-write`, `ask-on-shell`, or `auto-approve`
3. **Custom Endpoints** - Configure Ollama, LM Studio, or other OpenAI-compatible endpoints
4. **Models** - Select default models per provider and conversation

Configuration is stored in the app data directory and can be overridden via environment variables:

```bash
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
GOOGLE_API_KEY=your_key
# etc.
```

## Development

### Start the Desktop App

For local development with hot reload:

```bash
npm run electron:dev
```

This starts both the Vite renderer dev server and the Electron main process.

### Start the Terminal Version

For the original terminal-based interface:

```bash
npm run dev
```

### Build

Build the core package:

```bash
npm run build
```

Build the desktop app bundle:

```bash
npm run electron:build
```

Create an unpacked Electron bundle:

```bash
npm run electron:pack
```

Create a release build with auto-update support:

```bash
npm run electron:release
```

### Development Scripts

```bash
npm run test          # Run tests
npm run lint          # Run ESLint
npm run typecheck     # Run TypeScript checks
npm run dev:vite      # Start Vite dev server only
```

## Using Omni Code

### 1. Launch the App

Start the desktop app:

```bash
npm run electron:dev
```

On first launch, the app initializes settings and prompts for API keys if not configured.

### 2. Open a Workspace

Open a project folder using:
- `Open Folder` button on the welcome screen
- `Cmd/Ctrl + O` keyboard shortcut
- Select from recent workspaces on the welcome screen

The app automatically indexes the codebase for semantic search and loads the file explorer.

### 3. Start a Conversation

Click the `+` button in the chat panel to create a new conversation tab. Each conversation:
- Has its own message history
- Can use different models
- Can have different modes enabled
- Persists across app restarts (per workspace)

### 4. Chat with the Agent

Type requests in the chat box. The agent can:
- Read and analyze files
- Search the codebase (text and semantic)
- Write and edit code
- Run terminal commands
- Use Git operations
- Browse the web
- Generate and execute plans

Typical prompts:

- `Explain this codebase structure`
- `Refactor the auth module to use JWT`
- `Find and fix the bug in the user service`
- `Create a plan for adding payment integration`

### 5. Review File Changes

When the agent proposes changes:
- Changes appear inline in the chat
- Review diff showing before/after
- Accept or reject individual changes
- Accept all changes at once
- Restore from backup if needed

Enable auto-approval in Settings to skip manual review.

### 6. Use the File Explorer

- Browse files in the sidebar
- Click files to open in the editor
- Multiple files open as tabs
- File changes are watched and updated in real-time

### 7. Work with Git

Open the Git panel to:
- See repository status (staged, modified, untracked)
- Stage and unstage files
- View diffs
- Commit changes
- Push and pull
- Switch branches

### 8. Access the Terminal

Open the Terminal panel for:
- Running npm/yarn commands
- Starting dev servers
- Running tests
- Any shell operations

### 9. Use Browser Automation

The agent can control a browser for:
- Testing web applications
- Verifying UI changes
- Taking screenshots
- Web scraping (when needed)

### 10. Enable Remote Access

From Settings, enable remote access to:
- Generate a QR code
- Pair with mobile devices
- Access conversations from tablets/phones
- Share workspaces securely

### 11. Track Usage

Open the Usage Dashboard to monitor:
- Token consumption per model
- Cost breakdown by provider
- Monthly usage trends
- Set spending limits

### 12. Configure Modes

Use the Mode Selector to switch between:
- **Code** - Standard coding with all tools
- **Architect** - Plan and analyze without writing code
- **Review** - Analyze code for issues
- **Security** - Focus on vulnerabilities
- **Debug** - Systematic problem solving

### 13. Create Execution Plans

In Architect mode, ask the agent to create plans for complex tasks:

1. Request a plan: `Create a plan for adding user authentication`
2. Review the structured plan output
3. Approve, modify, or reject the plan
4. Switch to Code mode to execute
5. Track progress as steps complete

## Project Structure

```
main/              # Electron main-process code (IPC handlers, window management)
renderer/          # React-based desktop UI components
src/               # Core agent logic, providers, tools
├── core/          # Agent implementation, orchestration, cost tracking
├── providers/     # LLM provider integrations (Anthropic, OpenAI, etc.)
├── tools/         # Built-in tools (file operations, search, Git, etc.)
├── config/        # Configuration management, modes
├── memory/        # Session storage, project context, indexing
└── mcp/           # Model Context Protocol support
dist-electron/     # Built Electron output (generated)
release/           # Packaged desktop builds (generated)
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + O` | Open folder |
| `Cmd/Ctrl + ,` | Open settings |
| `Cmd/Ctrl + B` | Toggle sidebar |
| `Cmd/Ctrl + Shift + P` | Toggle plan panel |
| `Cmd/Ctrl + Enter` | Send message (in chat) |
| `Escape` | Abort active agent run |
| `Cmd/Ctrl + N` | New conversation |
| `Cmd/Ctrl + W` | Close conversation |
| `Cmd/Ctrl + 1-9` | Switch to conversation tab |

## Troubleshooting

### App does not start

- Ensure port 5173 is available for the Vite dev server
- Check Electron terminal output for errors
- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Chat responses are slow or failing

- Verify API keys are correctly set in Settings
- Check your internet connection
- Try switching to a different model
- Check the Usage Dashboard for rate limit issues

### File changes not appearing

- Ensure the workspace is properly loaded
- Check file watching permissions
- Try re-indexing the codebase from Settings

### Semantic search not working

- Wait for initial indexing to complete (shown in status bar)
- Re-index from Settings if needed
- Check that the project has readable code files

### Terminal or Browser panels not working

- On macOS, grant necessary permissions in System Preferences
- Check that `node-pty` dependencies are installed
- Restart the app after granting permissions

### Git operations failing

- Ensure you're in a Git repository
- Check Git configuration (name/email set)
- Verify write permissions to the repository

## Notes

- Recent workspaces are stored with `electron-store`
- Conversations are persisted per workspace in `.omnicode/chat/` directories
- File change backups are stored temporarily for review/restore
- Indexing data is stored in workspace-local SQLite databases
- MCP servers can be configured for external tool integration

## Branching Intent

This repo represents the `omni-code-v2` edition, evolving independently from the original Omni Code branch. It focuses on desktop-first experience with advanced features like multi-agent orchestration, plan mode execution, and comprehensive provider support.

## License

MIT
