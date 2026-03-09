# Omni Code v2

Omni Code v2 is the Electron edition of Omni Code. It combines the original agent/core system with a desktop UI for chat, file browsing, code editing, settings, and workspace-based development.

## What It Includes

- Electron desktop app shell
- React renderer UI
- Built-in chat panel for working with the coding agent
- File explorer and editor layout
- Recent workspace support
- Settings and model/provider configuration hooks

## Requirements

- Node.js `20+`
- npm
- macOS, Linux, or Windows with Electron support

## Install

```bash
npm install
```

## Start The App

For local development:

```bash
npm run electron:dev
```

This starts:

- the Vite renderer dev server
- the Electron main process

For a direct Electron run against the built app entry:

```bash
npm run electron:run
```

If you use `electron:run`, make sure the app has already been built.

## Build

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

## Helpful Scripts

```bash
npm run test
npm run lint
npm run typecheck
npm run dev
```

`npm run dev` starts the original terminal-based entrypoint, while `npm run electron:dev` starts the desktop app.

## Using Omni Code v2

### 1. Launch the App

Start the app with:

```bash
npm run electron:dev
```

When the window opens, Omni Code v2 initializes settings, models, providers, and recent workspaces.

### 2. Open a Workspace

Use one of these:

- `Open Folder` from the welcome screen
- `Cmd/Ctrl+O`
- a recent workspace from the welcome screen or app menu

After opening a folder, the app sets that directory as the active workspace and loads it into the file explorer.

### 3. Work With The Layout

The main window includes:

- a file explorer sidebar
- a central code editor
- a chat panel for agent interactions
- a status bar with model and app state

You can resize panels and toggle sidebar/chat visibility from the menu.

### 4. Use The Chat

The chat panel is where you interact with the coding agent.

Typical workflow:

1. Open a workspace.
2. Type a request in the chat box.
3. Let the agent inspect files, reason, and run supported tools.
4. Review the streamed response and any tool activity shown inline.

Example prompts:

- `Explain this codebase`
- `Refactor the selected code`
- `Find and fix bugs`
- `Add a new command for opening recent workspaces`

### 5. Open and Edit Files

- Select files from the explorer to open them in the editor.
- Multiple files can be opened in tabs.
- Settings are also exposed as a virtual editor tab from the app menu.

### 6. Settings and Shortcuts

Open settings with:

- `Cmd/Ctrl+,`
- the app menu

Current shortcuts include:

- `Cmd/Ctrl+O` to open a folder
- `Cmd/Ctrl+,` to open settings
- `Cmd/Ctrl+B` to toggle the sidebar
- `Cmd/Ctrl+Enter` for send-message behavior where supported
- `Escape` to abort an active agent run

## Project Structure

```text
main/        Electron main-process code
renderer/    React-based desktop UI
src/         Shared/core Omni Code agent logic
dist-electron/  Built Electron output
release/     Packaged desktop builds
```

## Notes

- Recent workspaces are stored with `electron-store`.
- The Electron app depends on the Omni Code core in `src/`.
- Build output directories like `dist-electron/` and `release/` are generated artifacts and should not be edited directly.

## Troubleshooting

### Window does not open

- Re-run `npm run electron:dev`
- Make sure port `5173` is available
- Check the Electron terminal output for startup errors

### Chat output looks wrong

- Restart the app after pulling new changes
- Confirm you are running the Electron version, not the terminal entrypoint

### App fails on install

- Delete `node_modules` and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Branching Intent

This repo state is intended to represent the separate `omni-code-v2` edition so it can evolve independently from the original Omni Code branch and UI.
