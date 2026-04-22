"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main/remote-auth.ts
var remote_auth_exports = {};
__export(remote_auth_exports, {
  createProxySession: () => createProxySession,
  ensureApiKey: () => ensureApiKey,
  generateApiKey: () => generateApiKey,
  getApiKey: () => getApiKey,
  getCorsOptions: () => getCorsOptions,
  regenerateApiKey: () => regenerateApiKey,
  validateApiKey: () => validateApiKey,
  validateIp: () => validateIp,
  validateProxySessionToken: () => validateProxySessionToken,
  validateRequestSignature: () => validateRequestSignature
});
module.exports = __toCommonJS(remote_auth_exports);
var import_node_crypto = require("crypto");

// main/settings.ts
var import_electron = require("electron");
var defaultSettings = {
  general: {
    theme: "dark",
    fontFamily: "'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace",
    fontSize: 14,
    sidebarVisible: true,
    chatVisible: true,
    windowRestore: "last"
  },
  editor: {
    tabSize: 2,
    wordWrap: "on",
    minimap: true,
    lineNumbers: "on",
    formatOnSave: true,
    autoSave: "off",
    autoSaveDelay: 1e3,
    showWhitespace: false,
    smoothScrolling: true,
    cursorBlinking: "blink"
  },
  ai: {
    activeModels: [],
    // empty = all models available in chat panel
    temperature: 0.7,
    maxContextTokens: 128e3,
    autoRunMode: "always",
    showTokenCosts: true,
    showThinking: true,
    autoAcceptEdits: false,
    contextCompressionThreshold: 0.9,
    contextRecentMessagesToKeep: 6,
    maxTurns: null
  },
  chat: {
    autoSave: true,
    autoSaveIntervalMs: 3e3,
    maxSavedChatsPerWorkspace: 50
  },
  shortcuts: {
    openChat: "CmdOrCtrl+Shift+L",
    toggleSidebar: "CmdOrCtrl+B",
    toggleChat: "CmdOrCtrl+Shift+C",
    sendMessage: "CmdOrCtrl+Enter",
    abortAgent: "Escape",
    acceptAllEdits: "CmdOrCtrl+Shift+A",
    rejectAllEdits: "CmdOrCtrl+Shift+R",
    openSettings: "CmdOrCtrl+,",
    newFile: "CmdOrCtrl+N",
    openFolder: "CmdOrCtrl+O",
    saveFile: "CmdOrCtrl+S",
    formatDocument: "Shift+Alt+F",
    searchFiles: "CmdOrCtrl+Shift+F"
  },
  files: {
    excludePatterns: [
      "node_modules/**",
      ".git/**",
      "dist/**",
      "build/**",
      ".next/**",
      ".cache/**",
      "**/*.log",
      "**/Thumbs.db",
      "**/.DS_Store"
    ],
    defaultWorkspace: null,
    recentFolders: [],
    maxRecentFolders: 10,
    recentWorkspaces: [],
    maxRecentWorkspaces: 10,
    followSymlinks: false
  },
  indexing: {
    autoIndex: true,
    autoSync: true,
    syncIntervalMinutes: 5,
    useSemanticChunking: true,
    maxFilesToIndex: 500,
    maxFileSizeMB: 1,
    excludePatterns: [
      "node_modules/**",
      ".git/**",
      "dist/**",
      "build/**",
      "**/*.min.js",
      "**/*.bundle.js",
      "**/package-lock.json",
      "**/yarn.lock"
    ]
  },
  privacy: {
    telemetryEnabled: false,
    crashReportsEnabled: false,
    analyticsEnabled: false
  },
  apiKeys: {},
  customModels: [],
  usage: {
    monthlyLimit: null,
    alertThresholds: [0.8, 0.95, 1],
    dataRetentionMonths: 12,
    showInStatusBar: true
  },
  notifications: {
    enabled: true,
    soundEnabled: true,
    sound: "default",
    playOnUserInput: true,
    playOnResponseComplete: true,
    showTrayBadge: true
  },
  remoteAccess: {
    enabled: false,
    tunnelProvider: "ngrok",
    ngrokAuthToken: "",
    cloudflaredToken: "",
    apiKey: null,
    port: 3e3,
    allowedOrigins: [],
    rateLimitRequests: 100,
    rateLimitWindowMs: 15 * 60 * 1e3,
    // 15 minutes
    proxyEnabled: true,
    proxyAllowedPorts: []
  },
  remoteClient: {
    url: "",
    apiKey: "",
    autoConnect: false
  },
  adb: {
    enabled: true,
    path: "adb"
  },
  changeReview: {
    enabled: true,
    mode: "all"
  }
};
var settingsManagerInstance = null;
var syncManagerProxy = {
  get: (path) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.get(path);
  },
  getAll: () => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.getAll();
  },
  set: (path, value) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.set(path, value);
  },
  reset: (path) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.reset(path);
  },
  addRecentFolder: (folderPath) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.addRecentFolder(folderPath);
  },
  getRecentFolders: () => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.getRecentFolders();
  },
  addRecentWorkspace: (workspacePath) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.addRecentWorkspace(workspacePath);
  },
  getRecentWorkspaces: () => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.getRecentWorkspaces();
  },
  onChange: (callback) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.onChange(callback);
  }
};
var settingsManager = syncManagerProxy;

// main/remote-auth.ts
var crypto = __toESM(require("crypto"), 1);
var proxySessionStore = /* @__PURE__ */ new Map();
function createProxySession(port) {
  const token = (0, import_node_crypto.randomBytes)(32).toString("hex");
  proxySessionStore.set(token, { port, expiresAt: Date.now() + 60 * 60 * 1e3 });
  for (const [key, val] of proxySessionStore) {
    if (val.expiresAt < Date.now())
      proxySessionStore.delete(key);
  }
  return token;
}
function validateProxySessionToken(token) {
  const session = proxySessionStore.get(token);
  if (!session)
    return false;
  if (session.expiresAt < Date.now()) {
    proxySessionStore.delete(token);
    return false;
  }
  return true;
}
function validateApiKey(req, res, next) {
  const cookieHeader = req.headers["cookie"] || "";
  const cookieMap = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()])
  );
  const sessionToken = cookieMap["omni-proxy-session"];
  if (sessionToken && validateProxySessionToken(sessionToken)) {
    next();
    return;
  }
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    res.status(401).json({ error: "Missing API key. Include X-API-Key header." });
    return;
  }
  const storedKey = settingsManager.get("remoteAccess.apiKey");
  if (!storedKey) {
    res.status(500).json({ error: "Server not properly configured. API key not set." });
    return;
  }
  if (!timingSafeEqual2(apiKey, storedKey)) {
    res.status(401).json({ error: "Invalid API key." });
    return;
  }
  next();
}
function generateApiKey() {
  return (0, import_node_crypto.randomBytes)(32).toString("hex");
}
function ensureApiKey() {
  let apiKey = settingsManager.get("remoteAccess.apiKey");
  if (!apiKey) {
    apiKey = generateApiKey();
    settingsManager.set("remoteAccess.apiKey", apiKey);
    console.log("[RemoteAuth] Generated new API key for remote access");
  }
  return apiKey;
}
function getApiKey() {
  return settingsManager.get("remoteAccess.apiKey");
}
function regenerateApiKey() {
  const newKey = generateApiKey();
  settingsManager.set("remoteAccess.apiKey", newKey);
  console.log("[RemoteAuth] Regenerated API key for remote access");
  return newKey;
}
function getCorsOptions() {
  const allowedOrigins = settingsManager.get("remoteAccess.allowedOrigins");
  const origin = allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true;
  return {
    origin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-API-Key", "Authorization"],
    credentials: true
  };
}
function validateIp(req, res, next) {
  next();
}
function validateRequestSignature(req, res, next) {
  const cookieHeader = req.headers["cookie"] || "";
  const cookieMap = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()])
  );
  const sessionToken = cookieMap["omni-proxy-session"];
  if (sessionToken && validateProxySessionToken(sessionToken)) {
    next();
    return;
  }
  const timestamp = req.headers["x-timestamp"];
  const signature = req.headers["x-signature"];
  if (!timestamp || !signature) {
    res.status(401).json({ error: "Missing X-Timestamp or X-Signature headers." });
    return;
  }
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1e3) {
    res.status(401).json({ error: "Request timestamp is expired or invalid." });
    return;
  }
  const apiKey = settingsManager.get("remoteAccess.apiKey");
  if (!apiKey) {
    res.status(500).json({ error: "Server not properly configured." });
    return;
  }
  const signingString = `${req.method}
${req.originalUrl}
${timestamp}`;
  const expected = crypto.createHmac("sha256", apiKey).update(signingString).digest("hex");
  console.log("[SignatureDebug] Server signing string:", JSON.stringify(signingString));
  console.log("[SignatureDebug] Server expected sig:", expected.substring(0, 16) + "...");
  console.log("[SignatureDebug] Client sent sig:", signature.substring(0, 16) + "...");
  if (!timingSafeEqual2(signature, expected)) {
    res.status(401).json({ error: "Invalid request signature.", debug: { serverString: signingString } });
    return;
  }
  next();
}
function timingSafeEqual2(a, b) {
  if (a.length !== b.length) {
    const bufA2 = Buffer.from(a);
    const bufB2 = Buffer.alloc(bufA2.length, 0);
    crypto.timingSafeEqual(bufA2, bufB2);
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createProxySession,
  ensureApiKey,
  generateApiKey,
  getApiKey,
  getCorsOptions,
  regenerateApiKey,
  validateApiKey,
  validateIp,
  validateProxySessionToken,
  validateRequestSignature
});
//# sourceMappingURL=remote-auth.cjs.map