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
    sendMessage: (conversationId, message, workingDirectory) => import_electron.ipcRenderer.invoke("agent:send-message", conversationId, message, workingDirectory),
    abort: (conversationId) => import_electron.ipcRenderer.invoke("agent:abort", conversationId),
    switchModel: (conversationId, model, provider) => import_electron.ipcRenderer.invoke("agent:switch-model", conversationId, model, provider),
    clearConversation: (conversationId) => import_electron.ipcRenderer.invoke("agent:clear-conversation", conversationId),
    getTokenCount: (conversationId) => import_electron.ipcRenderer.invoke("agent:get-token-count", conversationId),
    setMode: (conversationId, mode) => import_electron.ipcRenderer.invoke("agent:set-mode", conversationId, mode),
    respondPermission: (toolId, decision) => import_electron.ipcRenderer.invoke("agent:respond-permission", toolId, decision),
    respondUserInput: (requestId, response, cancelled) => import_electron.ipcRenderer.invoke("agent:respond-user-input", requestId, response, cancelled),
    setPermissionMode: (autoRunMode) => import_electron.ipcRenderer.invoke("agent:set-permission-mode", autoRunMode),
    onEvent: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("agent:event", handler);
      return () => import_electron.ipcRenderer.off("agent:event", handler);
    }
  },
  file: {
    read: (filePath) => import_electron.ipcRenderer.invoke("file:read", filePath),
    write: (filePath, content) => import_electron.ipcRenderer.invoke("file:write", filePath, content),
    edit: (filePath, oldString, newString) => import_electron.ipcRenderer.invoke("file:edit", filePath, oldString, newString),
    list: (dirPath) => import_electron.ipcRenderer.invoke("file:list", dirPath),
    watch: (dirPath) => import_electron.ipcRenderer.invoke("file:watch", dirPath),
    unwatch: (dirPath) => import_electron.ipcRenderer.invoke("file:unwatch", dirPath),
    onChange: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("file:change", handler);
      return () => import_electron.ipcRenderer.off("file:change", handler);
    },
    backup: (conversationId, messageId, toolCallId, filePath, changeType) => import_electron.ipcRenderer.invoke("file:backup", conversationId, messageId, toolCallId, filePath, changeType),
    restore: (conversationId, messageId) => import_electron.ipcRenderer.invoke("file:restore", conversationId, messageId),
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
    getCwd: () => import_electron.ipcRenderer.invoke("config:get-cwd")
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
    addSavedWorkspace: (workspacePath) => import_electron.ipcRenderer.invoke("settings:addSavedWorkspace", workspacePath),
    removeSavedWorkspace: (workspacePath) => import_electron.ipcRenderer.invoke("settings:removeSavedWorkspace", workspacePath),
    getSavedWorkspaces: () => import_electron.ipcRenderer.invoke("settings:getSavedWorkspaces"),
    resolve: (key, workspaceSettings, projectSettings) => import_electron.ipcRenderer.invoke("settings:resolve", key, workspaceSettings, projectSettings)
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
    export: (workspacePath) => import_electron.ipcRenderer.invoke("usage:export", workspacePath)
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
      const handler = () => callback();
      import_electron.ipcRenderer.on("app:before-quit", handler);
      return () => import_electron.ipcRenderer.off("app:before-quit", handler);
    },
    notifySaveComplete: () => {
      import_electron.ipcRenderer.invoke("app:save-complete");
    },
    onMenuAction: (callback) => {
      const handler = (_, action) => callback(action);
      import_electron.ipcRenderer.on("menu:action", handler);
      const menuChannels = [
        "menu:new-file",
        "menu:open-folder",
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
    getQRCode: () => import_electron.ipcRenderer.invoke("remote:get-qr-code")
  },
  workspace: {
    create: (options) => import_electron.ipcRenderer.invoke("workspace:create", options),
    saveToFile: (workspace, filePath) => import_electron.ipcRenderer.invoke("workspace:saveToFile", workspace, filePath),
    loadFromFile: (filePath) => import_electron.ipcRenderer.invoke("workspace:loadFromFile", filePath),
    loadById: (workspaceId) => import_electron.ipcRenderer.invoke("workspace:loadById", workspaceId),
    update: (workspace) => import_electron.ipcRenderer.invoke("workspace:update", workspace),
    list: () => import_electron.ipcRenderer.invoke("workspace:list"),
    delete: (workspaceId, deleteData) => import_electron.ipcRenderer.invoke("workspace:delete", workspaceId, deleteData),
    addFolder: (workspaceId, folderPath, folderName) => import_electron.ipcRenderer.invoke("workspace:addFolder", workspaceId, folderPath, folderName),
    removeFolder: (workspaceId, folderId) => import_electron.ipcRenderer.invoke("workspace:removeFolder", workspaceId, folderId),
    rename: (workspaceId, newName) => import_electron.ipcRenderer.invoke("workspace:rename", workspaceId, newName),
    export: (workspaceId, targetDir) => import_electron.ipcRenderer.invoke("workspace:export", workspaceId, targetDir),
    import: (sourceDir) => import_electron.ipcRenderer.invoke("workspace:import", sourceDir),
    chat: {
      save: (workspace, conversation) => import_electron.ipcRenderer.invoke("workspace:chat:save", workspace, conversation),
      load: (workspace) => import_electron.ipcRenderer.invoke("workspace:chat:load", workspace),
      delete: (workspace, conversationId) => import_electron.ipcRenderer.invoke("workspace:chat:delete", workspace, conversationId),
      list: (workspace) => import_electron.ipcRenderer.invoke("workspace:chat:list", workspace)
    },
    indexing: {
      start: (workspace) => import_electron.ipcRenderer.invoke("workspace:indexing:start", workspace),
      reindex: (workspace) => import_electron.ipcRenderer.invoke("workspace:indexing:reindex", workspace),
      reindexProject: (workspace, projectId) => import_electron.ipcRenderer.invoke("workspace:indexing:reindexProject", workspace, projectId),
      stop: (workspaceId) => import_electron.ipcRenderer.invoke("workspace:indexing:stop", workspaceId),
      getState: (workspaceId) => import_electron.ipcRenderer.invoke("workspace:indexing:getState", workspaceId),
      query: (workspaceId, query, options) => import_electron.ipcRenderer.invoke("workspace:indexing:query", workspaceId, query, options),
      clear: (workspaceId) => import_electron.ipcRenderer.invoke("workspace:indexing:clear", workspaceId),
      close: (workspaceId) => import_electron.ipcRenderer.invoke("workspace:indexing:close", workspaceId),
      closeAll: () => import_electron.ipcRenderer.invoke("workspace:indexing:closeAll")
    }
  },
  sharedWorkspaces: {
    list: () => import_electron.ipcRenderer.invoke("shared-workspaces:list"),
    addWorkspace: (filePath) => import_electron.ipcRenderer.invoke("shared-workspaces:add-workspace", filePath),
    addFolder: (folderPath) => import_electron.ipcRenderer.invoke("shared-workspaces:add-folder", folderPath),
    remove: (sharedId) => import_electron.ipcRenderer.invoke("shared-workspaces:remove", sharedId),
    setActive: (sharedId) => import_electron.ipcRenderer.invoke("shared-workspaces:set-active", sharedId),
    getActive: () => import_electron.ipcRenderer.invoke("shared-workspaces:active")
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