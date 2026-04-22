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

// main/terminal-manager.ts
var terminal_manager_exports = {};
__export(terminal_manager_exports, {
  createTerminal: () => createTerminal,
  destroyAllTerminals: () => destroyAllTerminals,
  destroyTerminal: () => destroyTerminal,
  getTerminalBuffer: () => getTerminalBuffer,
  registerTerminalCallback: () => registerTerminalCallback,
  resizeTerminal: () => resizeTerminal,
  unregisterTerminalCallback: () => unregisterTerminalCallback,
  writeToTerminal: () => writeToTerminal
});
module.exports = __toCommonJS(terminal_manager_exports);
var pty = __toESM(require("node-pty"), 1);
var os = __toESM(require("os"), 1);
var path = __toESM(require("path"), 1);
var fs = __toESM(require("fs"), 1);
function ensureSpawnHelperExecutable() {
  try {
    const ptyDir = path.dirname(require.resolve("node-pty/package.json"));
    const platform = `${process.platform}-${process.arch}`;
    const helperPath = path.join(ptyDir, "prebuilds", platform, "spawn-helper");
    if (fs.existsSync(helperPath)) {
      fs.chmodSync(helperPath, 493);
    }
  } catch {
  }
}
ensureSpawnHelperExecutable();
var OUTPUT_BUFFER_LIMIT = 64 * 1024;
var sessions = /* @__PURE__ */ new Map();
function getShell() {
  if (process.platform === "win32") {
    return process.env.COMSPEC || "cmd.exe";
  }
  return process.env.SHELL || "/bin/zsh";
}
function createTerminal(id, cwd, cols, rows, window) {
  if (sessions.has(id)) {
    destroyTerminal(id);
  }
  const shell = getShell();
  const resolvedCwd = path.resolve(cwd || os.homedir());
  const safeCwd = fs.existsSync(resolvedCwd) ? resolvedCwd : os.homedir();
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-256color",
    cols,
    rows,
    cwd: safeCwd,
    env: {
      ...process.env,
      TERM: "xterm-256color",
      COLORTERM: "truecolor"
    }
  });
  ptyProcess.onData((data) => {
    if (!window.isDestroyed()) {
      window.webContents.send("terminal:data", { id, data });
    }
    const session = sessions.get(id);
    if (session) {
      session.outputBuffer += data;
      if (session.outputBuffer.length > OUTPUT_BUFFER_LIMIT) {
        session.outputBuffer = session.outputBuffer.slice(session.outputBuffer.length - OUTPUT_BUFFER_LIMIT);
      }
      for (const cb of session.outputCallbacks) {
        cb(data);
      }
    }
  });
  ptyProcess.onExit(() => {
    sessions.delete(id);
    if (!window.isDestroyed()) {
      window.webContents.send("terminal:exit", { id });
    }
  });
  sessions.set(id, { id, pty: ptyProcess, outputCallbacks: /* @__PURE__ */ new Set(), outputBuffer: "" });
}
function writeToTerminal(id, data) {
  const session = sessions.get(id);
  if (session) {
    session.pty.write(data);
  }
}
function resizeTerminal(id, cols, rows) {
  const session = sessions.get(id);
  if (session) {
    session.pty.resize(cols, rows);
  }
}
function destroyTerminal(id) {
  const session = sessions.get(id);
  if (session) {
    try {
      session.pty.kill();
    } catch {
    }
    sessions.delete(id);
  }
}
function destroyAllTerminals() {
  for (const id of sessions.keys()) {
    destroyTerminal(id);
  }
}
function registerTerminalCallback(id, cb) {
  sessions.get(id)?.outputCallbacks.add(cb);
}
function unregisterTerminalCallback(id, cb) {
  sessions.get(id)?.outputCallbacks.delete(cb);
}
function getTerminalBuffer(id) {
  return sessions.get(id)?.outputBuffer ?? "";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createTerminal,
  destroyAllTerminals,
  destroyTerminal,
  getTerminalBuffer,
  registerTerminalCallback,
  resizeTerminal,
  unregisterTerminalCallback,
  writeToTerminal
});
//# sourceMappingURL=terminal-manager.cjs.map