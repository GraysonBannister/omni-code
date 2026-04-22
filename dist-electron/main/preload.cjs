"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main/preload.ts
var preload_exports = {};
module.exports = __toCommonJS(preload_exports);
var import_electron = require("electron");
var api = {
  agent: {
    createConversation: (conversationId, model, provider) => import_electron.ipcRenderer.invoke("agent:create-conversation", conversationId, model, provider),
    closeConversation: (conversationId) => import_electron.ipcRenderer.invoke("agent:close-conversation", conversationId),
    hasConversation: (conversationId) => import_electron.ipcRenderer.invoke("agent:has-conversation", conversationId),
    sendMessage: (conversationId, message, workingDirectory, fileReferences, images) => import_electron.ipcRenderer.invoke("agent:send-message", conversationId, message, workingDirectory, fileReferences, images),
    abort: (conversationId) => import_electron.ipcRenderer.invoke("agent:abort", conversationId),
    switchModel: (conversationId, model, provider) => import_electron.ipcRenderer.invoke("agent:switch-model", conversationId, model, provider),
    clearConversation: (conversationId) => import_electron.ipcRenderer.invoke("agent:clear-conversation", conversationId),
    getTokenCount: (conversationId) => import_electron.ipcRenderer.invoke("agent:get-token-count", conversationId),
    restoreHistory: (conversationId, messages) => import_electron.ipcRenderer.invoke("agent:restore-history", conversationId, messages),
    setMode: (conversationId, mode) => import_electron.ipcRenderer.invoke("agent:set-mode", conversationId, mode),
    respondPermission: (toolId, decision) => import_electron.ipcRenderer.invoke("agent:respond-permission", toolId, decision),
    respondUserInput: (requestId, response, cancelled) => import_electron.ipcRenderer.invoke("agent:respond-user-input", requestId, response, cancelled),
    setPermissionMode: (autoRunMode) => import_electron.ipcRenderer.invoke("agent:set-permission-mode", autoRunMode),
    setChangeReviewEnabled: (enabled) => import_electron.ipcRenderer.invoke("agent:set-change-review-enabled", enabled),
    respondToChangeReview: (conversationId, messageId, toolCallId, decision) => import_electron.ipcRenderer.invoke("changes:respond", conversationId, messageId, toolCallId, decision),
    acceptAllChanges: (conversationId) => import_electron.ipcRenderer.invoke("changes:accept-all", conversationId),
    rejectAllChanges: (conversationId, messageId) => import_electron.ipcRenderer.invoke("changes:reject-all", conversationId, messageId),
    onEvent: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("agent:event", handler);
      return () => import_electron.ipcRenderer.off("agent:event", handler);
    }
  },
  file: {
    read: (filePath) => import_electron.ipcRenderer.invoke("file:read", filePath),
    readBinary: (filePath) => import_electron.ipcRenderer.invoke("file:readBinary", filePath),
    write: (filePath, content) => import_electron.ipcRenderer.invoke("file:write", filePath, content),
    edit: (filePath, oldString, newString) => import_electron.ipcRenderer.invoke("file:edit", filePath, oldString, newString),
    list: (dirPath) => import_electron.ipcRenderer.invoke("file:list", dirPath),
    mkdir: (dirPath) => import_electron.ipcRenderer.invoke("file:mkdir", dirPath),
    rename: (oldPath, newPath) => import_electron.ipcRenderer.invoke("file:rename", oldPath, newPath),
    delete: (filePath) => import_electron.ipcRenderer.invoke("file:delete", filePath),
    revealInFinder: (filePath) => import_electron.ipcRenderer.invoke("file:revealInFinder", filePath),
    copyPath: (filePath, type, workspacePath) => import_electron.ipcRenderer.invoke("file:copyPath", filePath, type, workspacePath),
    watch: (dirPath) => import_electron.ipcRenderer.invoke("file:watch", dirPath),
    unwatch: (dirPath) => import_electron.ipcRenderer.invoke("file:unwatch", dirPath),
    onChange: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("file:change", handler);
      return () => import_electron.ipcRenderer.off("file:change", handler);
    },
    backup: (conversationId, messageId, toolCallId, filePath, changeType) => import_electron.ipcRenderer.invoke("file:backup", conversationId, messageId, toolCallId, filePath, changeType),
    restore: (conversationId, messageId) => import_electron.ipcRenderer.invoke("file:restore", conversationId, messageId),
    reapply: (conversationId, messageId) => import_electron.ipcRenderer.invoke("file:reapply", conversationId, messageId),
    getChanges: (conversationId, messageId) => import_electron.ipcRenderer.invoke("file:getChanges", conversationId, messageId),
    getAllChanges: (conversationId) => import_electron.ipcRenderer.invoke("file:getAllChanges", conversationId),
    hasChanges: (conversationId, messageId) => import_electron.ipcRenderer.invoke("file:hasChanges", conversationId, messageId),
    getDiff: (conversationId, messageId, filePath) => import_electron.ipcRenderer.invoke("file:getDiff", conversationId, messageId, filePath),
    searchContent: (projectPath, searchTerm) => import_electron.ipcRenderer.invoke("file:searchContent", projectPath, searchTerm)
  },
  tool: {
    execute: (toolName, input) => import_electron.ipcRenderer.invoke("tool:execute", toolName, input),
    list: () => import_electron.ipcRenderer.invoke("tool:list"),
    getMetadata: (toolName) => import_electron.ipcRenderer.invoke("tools:get-metadata", toolName)
  },
  config: {
    get: (key) => import_electron.ipcRenderer.invoke("config:get", key),
    set: (key, value) => import_electron.ipcRenderer.invoke("config:set", key, value),
    getModels: () => import_electron.ipcRenderer.invoke("config:get-models"),
    getProviders: () => import_electron.ipcRenderer.invoke("config:get-providers"),
    setCwd: (cwd) => import_electron.ipcRenderer.invoke("config:set-cwd", cwd),
    getCwd: () => import_electron.ipcRenderer.invoke("config:get-cwd"),
    setWorkspaceContext: (activeFolderPath, workspaceName, folders) => import_electron.ipcRenderer.invoke("config:set-workspace-context", activeFolderPath, workspaceName, folders),
    clearWorkspaceContext: () => import_electron.ipcRenderer.invoke("config:clear-workspace-context")
  },
  dialog: {
    openFolder: () => import_electron.ipcRenderer.invoke("dialog:open-folder"),
    createFolder: () => import_electron.ipcRenderer.invoke("dialog:create-folder"),
    openWorkspace: () => import_electron.ipcRenderer.invoke("dialog:open-workspace")
  },
  settings: {
    get: (path) => import_electron.ipcRenderer.invoke("settings:get", path),
    getAll: () => import_electron.ipcRenderer.invoke("settings:getAll"),
    set: (path, value) => import_electron.ipcRenderer.invoke("settings:set", path, value),
    reset: (path) => import_electron.ipcRenderer.invoke("settings:reset", path),
    addRecentFolder: (folderPath) => import_electron.ipcRenderer.invoke("settings:addRecentFolder", folderPath),
    getRecentFolders: () => import_electron.ipcRenderer.invoke("settings:getRecentFolders"),
    addRecentWorkspace: (workspacePath) => import_electron.ipcRenderer.invoke("settings:addRecentWorkspace", workspacePath),
    getRecentWorkspaces: () => import_electron.ipcRenderer.invoke("settings:getRecentWorkspaces"),
    getSystemSounds: () => import_electron.ipcRenderer.invoke("settings:getSystemSounds"),
    playTestSound: (soundId) => import_electron.ipcRenderer.invoke("settings:playTestSound", soundId)
  },
  chatStorage: {
    saveConversation: (workspacePath, conversation) => import_electron.ipcRenderer.invoke("chat:save", workspacePath, conversation),
    loadConversations: (workspacePath) => import_electron.ipcRenderer.invoke("chat:load", workspacePath),
    deleteConversation: (workspacePath, conversationId) => import_electron.ipcRenderer.invoke("chat:delete", workspacePath, conversationId),
    listConversations: (workspacePath) => import_electron.ipcRenderer.invoke("chat:list", workspacePath)
  },
  usage: {
    get: (month, workspacePath) => import_electron.ipcRenderer.invoke("usage:get", month, workspacePath),
    getSummary: (month, workspacePath) => import_electron.ipcRenderer.invoke("usage:getSummary", month, workspacePath),
    getAvailableMonths: (workspacePath) => import_electron.ipcRenderer.invoke("usage:getAvailableMonths", workspacePath),
    setLimit: (month, limit) => import_electron.ipcRenderer.invoke("usage:setLimit", month, limit),
    getLimits: () => import_electron.ipcRenderer.invoke("usage:getLimits"),
    cleanup: (monthsToKeep) => import_electron.ipcRenderer.invoke("usage:cleanup", monthsToKeep),
    export: (workspacePath) => import_electron.ipcRenderer.invoke("usage:export", workspacePath),
    getModelPricing: () => import_electron.ipcRenderer.invoke("usage:getModelPricing")
  },
  customModels: {
    testConnection: (config) => import_electron.ipcRenderer.invoke("custom-models:test-connection", config)
  },
  indexing: {
    start: (projectPath) => import_electron.ipcRenderer.invoke("indexing:start", projectPath),
    reindex: (projectPath) => import_electron.ipcRenderer.invoke("indexing:reindex", projectPath),
    stop: (projectPath) => import_electron.ipcRenderer.invoke("indexing:stop", projectPath),
    getState: (projectPath) => import_electron.ipcRenderer.invoke("indexing:getState", projectPath),
    query: (projectPath, query, topK) => import_electron.ipcRenderer.invoke("indexing:query", projectPath, query, topK),
    clear: (projectPath) => import_electron.ipcRenderer.invoke("indexing:clear", projectPath),
    close: (projectPath) => import_electron.ipcRenderer.invoke("indexing:close", projectPath),
    closeAll: () => import_electron.ipcRenderer.invoke("indexing:closeAll")
  },
  window: {
    minimize: () => import_electron.ipcRenderer.invoke("window:minimize"),
    maximize: () => import_electron.ipcRenderer.invoke("window:maximize"),
    close: () => import_electron.ipcRenderer.invoke("window:close")
  },
  app: {
    platform: () => import_electron.ipcRenderer.invoke("app:platform"),
    version: () => import_electron.ipcRenderer.invoke("app:version"),
    onBeforeQuit: (callback) => {
      const handler = (_, payload) => {
        callback(payload?.replyChannel ?? "app:save-complete");
      };
      import_electron.ipcRenderer.on("app:before-quit", handler);
      return () => import_electron.ipcRenderer.off("app:before-quit", handler);
    },
    notifySaveComplete: (replyChannel) => {
      import_electron.ipcRenderer.invoke(replyChannel ?? "app:save-complete");
    },
    checkForUpdates: () => import_electron.ipcRenderer.invoke("app:check-for-updates"),
    installUpdate: () => import_electron.ipcRenderer.invoke("app:install-update"),
    newWindow: () => import_electron.ipcRenderer.invoke("window:new"),
    onUpdateAvailable: (callback) => {
      const handler = (_, info) => callback(info);
      import_electron.ipcRenderer.on("app:update-available", handler);
      return () => import_electron.ipcRenderer.off("app:update-available", handler);
    },
    onUpdateDownloaded: (callback) => {
      const handler = (_, info) => callback(info);
      import_electron.ipcRenderer.on("app:update-downloaded", handler);
      return () => import_electron.ipcRenderer.off("app:update-downloaded", handler);
    },
    onMenuAction: (callback) => {
      const handler = (_, action) => callback(action);
      import_electron.ipcRenderer.on("menu:action", handler);
      const menuChannels = [
        "menu:new-file",
        "menu:open-folder",
        "menu:close-folder",
        "menu:close-workspace",
        "menu:save",
        "menu:open-settings",
        "menu:toggle-sidebar",
        "menu:toggle-chat",
        "menu:send-message",
        "menu:abort",
        "menu:clear-chat"
      ];
      menuChannels.forEach((channel) => {
        import_electron.ipcRenderer.on(channel, (_, ...args) => handler(_, channel.replace("menu:", "")));
      });
      return () => {
        import_electron.ipcRenderer.off("menu:action", handler);
        menuChannels.forEach((channel) => import_electron.ipcRenderer.removeAllListeners(channel));
      };
    },
    onOpenRecent: (callback) => {
      const handler = (_, path) => callback(path);
      import_electron.ipcRenderer.on("menu:open-recent", handler);
      return () => import_electron.ipcRenderer.off("menu:open-recent", handler);
    }
  },
  notifications: {
    requestSound: (type) => import_electron.ipcRenderer.invoke("notification:request-sound", type)
  },
  dialogs: {
    selectSoundFile: () => import_electron.ipcRenderer.invoke("dialogs:select-sound-file")
  },
  terminal: {
    create: (id, cwd, cols, rows) => import_electron.ipcRenderer.invoke("terminal:create", id, cwd, cols, rows),
    write: (id, data) => import_electron.ipcRenderer.invoke("terminal:write", id, data),
    resize: (id, cols, rows) => import_electron.ipcRenderer.invoke("terminal:resize", id, cols, rows),
    destroy: (id) => import_electron.ipcRenderer.invoke("terminal:destroy", id),
    onData: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("terminal:data", handler);
      return () => import_electron.ipcRenderer.off("terminal:data", handler);
    },
    onExit: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("terminal:exit", handler);
      return () => import_electron.ipcRenderer.off("terminal:exit", handler);
    }
  },
  browser: {
    open: (url, title) => import_electron.ipcRenderer.invoke("browser:open", url, title),
    navigate: (tabId, url) => import_electron.ipcRenderer.invoke("browser:navigate", tabId, url),
    close: (tabId) => import_electron.ipcRenderer.invoke("browser:close", tabId),
    onOpen: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("browser:open", handler);
      return () => import_electron.ipcRenderer.off("browser:open", handler);
    },
    onNavigate: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("browser:navigate", handler);
      return () => import_electron.ipcRenderer.off("browser:navigate", handler);
    },
    onClose: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("browser:close", handler);
      return () => import_electron.ipcRenderer.off("browser:close", handler);
    },
    onScreenshotRequest: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("browser:request-screenshot", handler);
      return () => import_electron.ipcRenderer.off("browser:request-screenshot", handler);
    },
    sendScreenshotResponse: (tabId, dataUrl, error) => import_electron.ipcRenderer.invoke("browser:screenshot-response", { tabId, dataUrl, error })
  },
  remote: {
    start: () => import_electron.ipcRenderer.invoke("remote:start"),
    stop: () => import_electron.ipcRenderer.invoke("remote:stop"),
    status: () => import_electron.ipcRenderer.invoke("remote:status"),
    regenerateApiKey: () => import_electron.ipcRenderer.invoke("remote:regenerate-api-key"),
    generateQR: () => import_electron.ipcRenderer.invoke("remote:generate-qr")
  },
  remoteClient: {
    connect: (url, apiKey) => import_electron.ipcRenderer.invoke("remote-client:connect", url, apiKey),
    disconnect: () => import_electron.ipcRenderer.invoke("remote-client:disconnect"),
    status: () => import_electron.ipcRenderer.invoke("remote-client:status"),
    testConnection: (url, apiKey) => import_electron.ipcRenderer.invoke("remote-client:test-connection", url, apiKey),
    onStatusChanged: (callback) => {
      const handler = (_, status) => callback(status);
      import_electron.ipcRenderer.on("remote-client:status-changed", handler);
      return () => import_electron.ipcRenderer.off("remote-client:status-changed", handler);
    }
  },
  project: {
    scan: (dirs) => import_electron.ipcRenderer.invoke("project:scan", dirs)
  },
  plan: {
    startCreation: (conversationId, userRequest) => import_electron.ipcRenderer.invoke("plan:start-creation", conversationId, userRequest),
    submitAnswers: (conversationId, answers) => import_electron.ipcRenderer.invoke("plan:submit-answers", conversationId, answers),
    approve: (conversationId, planFile) => import_electron.ipcRenderer.invoke("plan:approve", conversationId, planFile),
    modify: (conversationId, planFile, modifications) => import_electron.ipcRenderer.invoke("plan:modify", conversationId, planFile, modifications),
    reject: (conversationId) => import_electron.ipcRenderer.invoke("plan:reject", conversationId),
    pauseExecution: (conversationId) => import_electron.ipcRenderer.invoke("plan:pause-execution", conversationId),
    resumeExecution: (conversationId) => import_electron.ipcRenderer.invoke("plan:resume-execution", conversationId),
    abortExecution: (conversationId) => import_electron.ipcRenderer.invoke("plan:abort-execution", conversationId),
    // Plan file methods
    createFile: (workspaceRoot, plan, conversationId) => import_electron.ipcRenderer.invoke("plan:create-file", workspaceRoot, plan, conversationId),
    updateStep: (filePath, stepId, status) => import_electron.ipcRenderer.invoke("plan:update-step", filePath, stepId, status),
    markApproved: (filePath) => import_electron.ipcRenderer.invoke("plan:mark-approved", filePath),
    openFile: (filePath) => import_electron.ipcRenderer.invoke("plan:open-file", filePath),
    readFile: (filePath) => import_electron.ipcRenderer.invoke("plan:read-file", filePath),
    stopWatching: (filePath) => import_electron.ipcRenderer.invoke("plan:stop-watching", filePath),
    onFileChanged: (callback) => {
      const handler = (_, data) => callback(data);
      import_electron.ipcRenderer.on("plan:file-changed", handler);
      return () => import_electron.ipcRenderer.off("plan:file-changed", handler);
    }
  },
  rules: {
    list: () => import_electron.ipcRenderer.invoke("rules:list"),
    save: (id, fullContent) => import_electron.ipcRenderer.invoke("rules:save", id, fullContent),
    delete: (id) => import_electron.ipcRenderer.invoke("rules:delete", id),
    toggle: (id, enabled) => import_electron.ipcRenderer.invoke("rules:toggle", id, enabled)
  },
  skills: {
    list: () => import_electron.ipcRenderer.invoke("skills:list"),
    get: (id) => import_electron.ipcRenderer.invoke("skills:get", id),
    save: (id, content) => import_electron.ipcRenderer.invoke("skills:save", id, content),
    delete: (id) => import_electron.ipcRenderer.invoke("skills:delete", id)
  },
  git: {
    isRepo: (cwd) => import_electron.ipcRenderer.invoke("git:is-repo", cwd),
    status: (cwd) => import_electron.ipcRenderer.invoke("git:status", cwd),
    stage: (cwd, files) => import_electron.ipcRenderer.invoke("git:stage", cwd, files),
    stageAll: (cwd) => import_electron.ipcRenderer.invoke("git:stage-all", cwd),
    unstage: (cwd, files) => import_electron.ipcRenderer.invoke("git:unstage", cwd, files),
    commit: (cwd, message) => import_electron.ipcRenderer.invoke("git:commit", cwd, message),
    push: (cwd) => import_electron.ipcRenderer.invoke("git:push", cwd),
    pull: (cwd) => import_electron.ipcRenderer.invoke("git:pull", cwd),
    fetch: (cwd) => import_electron.ipcRenderer.invoke("git:fetch", cwd),
    diffFile: (cwd, filePath, staged) => import_electron.ipcRenderer.invoke("git:diff-file", cwd, filePath, staged),
    discard: (cwd, files) => import_electron.ipcRenderer.invoke("git:discard", cwd, files),
    branchList: (cwd) => import_electron.ipcRenderer.invoke("git:branch-list", cwd),
    checkout: (cwd, branch) => import_electron.ipcRenderer.invoke("git:checkout", cwd, branch),
    createBranch: (cwd, name) => import_electron.ipcRenderer.invoke("git:create-branch", cwd, name),
    log: (cwd, maxCount) => import_electron.ipcRenderer.invoke("git:log", cwd, maxCount),
    init: (cwd) => import_electron.ipcRenderer.invoke("git:init", cwd)
  },
  addons: {
    list: () => import_electron.ipcRenderer.invoke("addons:list"),
    install: (manifest) => import_electron.ipcRenderer.invoke("addons:install", manifest),
    uninstall: (id) => import_electron.ipcRenderer.invoke("addons:uninstall", id)
  },
  workspace: {
    create: (options) => import_electron.ipcRenderer.invoke("workspace:create", options),
    loadFromFile: (filePath) => import_electron.ipcRenderer.invoke("workspace:loadFromFile", filePath),
    update: (workspace) => import_electron.ipcRenderer.invoke("workspace:update", workspace),
    addFolder: (workspaceId, folderPath, folderName) => import_electron.ipcRenderer.invoke("workspace:addFolder", workspaceId, folderPath, folderName),
    removeFolder: (workspaceId, folderId) => import_electron.ipcRenderer.invoke("workspace:removeFolder", workspaceId, folderId),
    rename: (workspaceId, newName) => import_electron.ipcRenderer.invoke("workspace:rename", workspaceId, newName),
    list: () => import_electron.ipcRenderer.invoke("workspace:list"),
    export: (workspaceId, targetDir) => import_electron.ipcRenderer.invoke("workspace:export", workspaceId, targetDir),
    import: (sourceDir) => import_electron.ipcRenderer.invoke("workspace:import", sourceDir),
    delete: (workspaceId, deleteData) => import_electron.ipcRenderer.invoke("workspace:delete", workspaceId, deleteData),
    chat: {
      load: (workspace) => import_electron.ipcRenderer.invoke("workspace:chat:load", workspace),
      save: (workspace, conversation) => import_electron.ipcRenderer.invoke("workspace:chat:save", workspace, conversation),
      delete: (workspace, conversationId) => import_electron.ipcRenderer.invoke("workspace:chat:delete", workspace, conversationId)
    }
  },
  tray: {
    onNavigateToChat: (callback) => {
      const handler = (_, conversationId) => callback(conversationId);
      import_electron.ipcRenderer.on("tray:navigate-to-chat", handler);
      return () => import_electron.ipcRenderer.off("tray:navigate-to-chat", handler);
    },
    onClearAll: (callback) => {
      const handler = () => callback();
      import_electron.ipcRenderer.on("tray:clear-all", handler);
      return () => import_electron.ipcRenderer.off("tray:clear-all", handler);
    },
    onNotificationCleared: (callback) => {
      const handler = (_, conversationId) => callback(conversationId);
      import_electron.ipcRenderer.on("tray:notification-cleared", handler);
      return () => import_electron.ipcRenderer.off("tray:notification-cleared", handler);
    },
    onAllNotificationsCleared: (callback) => {
      const handler = () => callback();
      import_electron.ipcRenderer.on("tray:all-notifications-cleared", handler);
      return () => import_electron.ipcRenderer.off("tray:all-notifications-cleared", handler);
    },
    updateActiveConversation: (conversationId) => import_electron.ipcRenderer.invoke("tray:update-active", conversationId),
    updateRecentChats: (chats) => import_electron.ipcRenderer.invoke("tray:update-recent-chats", chats),
    updateOpenProject: (project) => import_electron.ipcRenderer.invoke("tray:update-open-project", project),
    clearNotification: (conversationId) => import_electron.ipcRenderer.invoke("tray:clear-notification", conversationId),
    clearAllNotifications: () => import_electron.ipcRenderer.invoke("tray:clear-all-notifications")
  },
  // System permissions API
  system: {
    checkPermissions: () => import_electron.ipcRenderer.invoke("system:check-permissions"),
    openSettings: (setting) => import_electron.ipcRenderer.invoke("system:open-settings", setting),
    requestPermission: (permissionName) => import_electron.ipcRenderer.invoke("system:request-permission", permissionName)
  }
};
import_electron.contextBridge.exposeInMainWorld("electronAPI", api);
import_electron.contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome
  }
});
//# sourceMappingURL=preload.cjs.map