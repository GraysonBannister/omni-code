// Remote Client - HTTP client for connecting the desktop app to a remote omni-code server
// Mirrors the protocol used by omni-code-go (api_service.dart + sse_service.dart)

import * as http from 'node:http';
import * as https from 'node:https';
import { createHmac } from 'node:crypto';
import { URL } from 'node:url';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RemoteClientConfig {
  baseUrl: string;
  apiKey: string;
}

export interface RemoteServerInfo {
  version?: string;
  name?: string;
  workspacePath?: string;
}

export interface FileEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

export interface AgentEventCallback {
  (event: Record<string, unknown> & { type: string }): void;
}

export interface TerminalDataCallback {
  (id: string, data: string): void;
}

export interface TerminalExitCallback {
  (id: string): void;
}

// ---------------------------------------------------------------------------
// RemoteClient
// ---------------------------------------------------------------------------

export class RemoteClient {
  private baseUrl: string;
  private apiKey: string;
  private agentSseController: AbortController | null = null;
  private terminalSseControllers = new Map<string, AbortController>();

  constructor(config: RemoteClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  // -------------------------------------------------------------------------
  // Auth helpers
  // -------------------------------------------------------------------------

  private buildAuthHeaders(method: string, path: string): Record<string, string> {
    const timestamp = Date.now().toString();
    const signingString = `${method.toUpperCase()}\n${path}\n${timestamp}`;
    const signature = createHmac('sha256', this.apiKey)
      .update(signingString)
      .digest('hex');

    return {
      'X-API-Key': this.apiKey,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
      'Content-Type': 'application/json',
    };
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(path, this.baseUrl + '/');
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }
    return url.toString();
  }

  private pathWithQuery(path: string, params?: Record<string, string>): string {
    if (!params || Object.keys(params).length === 0) return path;
    const sp = new URLSearchParams(params);
    return `${path}?${sp.toString()}`;
  }

  // -------------------------------------------------------------------------
  // Low-level HTTP fetch
  // -------------------------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    queryParams?: Record<string, string>,
  ): Promise<T> {
    const fullPath = this.pathWithQuery(path, queryParams);
    const headers = this.buildAuthHeaders(method, fullPath);
    const url = this.buildUrl(path, queryParams);

    const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr).toString();
    }

    return new Promise<T>((resolve, reject) => {
      const parsed = new URL(url);
      const options: http.RequestOptions = {
        method,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        headers,
      };

      const transport = parsed.protocol === 'https:' ? https : http;
      const req = transport.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          if (res.statusCode && res.statusCode >= 400) {
            let message = `HTTP ${res.statusCode}`;
            try {
              const parsed = JSON.parse(raw);
              message = parsed.error || parsed.message || message;
            } catch {
              // ignore parse error
            }
            reject(new Error(message));
            return;
          }
          try {
            resolve(JSON.parse(raw) as T);
          } catch {
            resolve(raw as unknown as T);
          }
        });
      });

      req.on('error', reject);
      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  }

  // -------------------------------------------------------------------------
  // Connection testing
  // -------------------------------------------------------------------------

  async testConnection(): Promise<{ success: boolean; info?: RemoteServerInfo; error?: string }> {
    try {
      // GET /api/status requires no auth — use it as a health check first
      const statusUrl = `${this.baseUrl}/api/status`;
      await new Promise<void>((resolve, reject) => {
        const parsed = new URL(statusUrl);
        const transport = parsed.protocol === 'https:' ? https : http;
        const req = transport.request(
          { method: 'GET', hostname: parsed.hostname, port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80), path: parsed.pathname },
          (res) => {
            res.resume();
            if (res.statusCode === 200) resolve();
            else reject(new Error(`Status endpoint returned ${res.statusCode}`));
          },
        );
        req.on('error', reject);
        req.setTimeout(8000, () => { req.destroy(); reject(new Error('Connection timed out')); });
        req.end();
      });

      // Then verify auth by hitting /api/config
      const config = await this.request<Record<string, unknown>>('GET', '/api/config');
      return {
        success: true,
        info: {
          workspacePath: config.workspacePath as string | undefined,
          version: config.version as string | undefined,
        },
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  // -------------------------------------------------------------------------
  // Agent operations
  // -------------------------------------------------------------------------

  async createConversation(conversationId: string, model?: string, provider?: string): Promise<boolean> {
    const result = await this.request<{ success: boolean }>('POST', '/api/agent/create-conversation', {
      conversationId,
      model,
      provider,
    });
    return result.success ?? false;
  }

  async sendMessage(
    conversationId: string,
    message: string,
    workingDirectory?: string,
    fileReferences?: Array<{ path: string; name: string; isDirectory: boolean; content?: string }>,
    images?: Array<{ mediaType: string; data: string }>,
  ): Promise<void> {
    await this.request<unknown>('POST', '/api/agent/send-message', {
      conversationId,
      message,
      workingDirectory,
      fileReferences,
      images,
    });
  }

  async abort(conversationId: string): Promise<void> {
    await this.request<unknown>('POST', '/api/agent/abort', { conversationId });
  }

  async closeConversation(conversationId: string): Promise<boolean> {
    const result = await this.request<{ success: boolean }>('POST', '/api/agent/close-conversation', { conversationId });
    return result.success ?? false;
  }

  async hasConversation(conversationId: string): Promise<boolean> {
    const result = await this.request<{ exists: boolean }>('GET', '/api/agent/conversations', undefined, {
      conversationId,
    });
    return result.exists ?? false;
  }

  async switchModel(conversationId: string, model: string, provider: string): Promise<boolean> {
    const result = await this.request<{ success: boolean }>('POST', '/api/agent/switch-model', {
      conversationId,
      model,
      provider,
    });
    return result.success ?? false;
  }

  async setMode(conversationId: string, mode: string): Promise<{ success: boolean; mode: string }> {
    return this.request<{ success: boolean; mode: string }>('POST', '/api/agent/set-mode', {
      conversationId,
      mode,
    });
  }

  async respondPermission(toolId: string, decision: 'allow' | 'deny' | 'allowAlways'): Promise<boolean> {
    const result = await this.request<{ success: boolean }>('POST', '/api/agent/respond-permission', {
      toolId,
      decision,
    });
    return result.success ?? false;
  }

  async respondUserInput(requestId: string, response: string, cancelled: boolean): Promise<boolean> {
    const result = await this.request<{ success: boolean }>('POST', '/api/agent/respond-user-input', {
      requestId,
      response,
      cancelled,
    });
    return result.success ?? false;
  }

  async clearConversation(conversationId: string): Promise<void> {
    await this.request<unknown>('POST', '/api/agent/close-conversation', { conversationId });
  }

  async getTokenCount(conversationId: string): Promise<number> {
    const result = await this.request<{ count: number }>('GET', '/api/agent/conversations', undefined, {
      conversationId,
    });
    return result.count ?? 0;
  }

  async restoreHistory(conversationId: string, messages: unknown[]): Promise<boolean> {
    const result = await this.request<{ success: boolean }>('POST', '/api/agent/create-conversation', {
      conversationId,
      messages,
    });
    return result.success ?? false;
  }

  async getModels(): Promise<Array<{ id: string; name: string; provider: string; available: boolean }>> {
    const result = await this.request<{ models: Array<{ id: string; name: string; provider: string; available: boolean }> }>('GET', '/api/models');
    return result.models ?? [];
  }

  async getWorkspaces(): Promise<Array<{ id: string; name: string; folders: Array<{ path: string }> }>> {
    const result = await this.request<{ workspaces: Array<{ id: string; name: string; folders: Array<{ path: string }> }> }>('GET', '/api/workspaces');
    return result.workspaces ?? [];
  }

  // -------------------------------------------------------------------------
  // File operations
  // -------------------------------------------------------------------------

  async readFile(filePath: string): Promise<{ content: string; error?: string }> {
    try {
      const result = await this.request<{ content: string }>('GET', '/api/files/read', undefined, {
        path: filePath,
      });
      return { content: result.content ?? '' };
    } catch (err) {
      return { content: '', error: (err as Error).message };
    }
  }

  async writeFile(filePath: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.request<{ success: boolean }>('POST', '/api/files/write', {
        path: filePath,
        content,
      });
      return { success: result.success ?? true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async editFile(filePath: string, oldString: string, newString: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.request<{ success: boolean }>('POST', '/api/files/edit', {
        path: filePath,
        oldString,
        newString,
      });
      return { success: result.success ?? true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async listFiles(dirPath: string): Promise<{ files: FileEntry[]; error?: string }> {
    try {
      const result = await this.request<{ files: FileEntry[] }>('GET', '/api/files/list', undefined, {
        path: dirPath,
      });
      return { files: result.files ?? [] };
    } catch (err) {
      return { files: [], error: (err as Error).message };
    }
  }

  async mkdir(dirPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.request<{ success: boolean }>('POST', '/api/files/mkdir', { path: dirPath });
      return { success: result.success ?? true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.request<{ success: boolean }>('POST', '/api/files/delete', { path: filePath });
      return { success: result.success ?? true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async searchContent(projectPath: string, searchTerm: string): Promise<{
    results: Array<{ path: string; lineNumber: number; preview: string }>;
    error?: string;
  }> {
    try {
      const result = await this.request<{ results: Array<{ path: string; lineNumber: number; preview: string }> }>(
        'GET',
        '/api/files/search',
        undefined,
        { path: projectPath, query: searchTerm },
      );
      return { results: result.results ?? [] };
    } catch (err) {
      return { results: [], error: (err as Error).message };
    }
  }

  // -------------------------------------------------------------------------
  // Terminal operations
  // -------------------------------------------------------------------------

  async createTerminal(id: string, cwd: string, cols: number, rows: number): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.request<{ success: boolean }>('POST', '/api/terminal/create', {
        id,
        cwd,
        cols,
        rows,
      });
      return { success: result.success ?? true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async writeTerminal(id: string, data: string): Promise<void> {
    await this.request<unknown>('POST', '/api/terminal/write', { id, data });
  }

  async resizeTerminal(id: string, cols: number, rows: number): Promise<void> {
    await this.request<unknown>('POST', '/api/terminal/resize', { id, cols, rows });
  }

  async destroyTerminal(id: string): Promise<void> {
    await this.request<unknown>('POST', '/api/terminal/destroy', { id });
  }

  // -------------------------------------------------------------------------
  // SSE: Agent events
  // -------------------------------------------------------------------------

  subscribeAgentEvents(
    onEvent: AgentEventCallback,
    conversationId?: string,
  ): void {
    if (this.agentSseController) {
      this.agentSseController.abort();
    }
    this.agentSseController = new AbortController();
    const { signal } = this.agentSseController;

    const queryParams: Record<string, string> = {};
    if (conversationId) queryParams.conversationId = conversationId;
    const fullPath = this.pathWithQuery('/api/agent/events', Object.keys(queryParams).length ? queryParams : undefined);
    const headers = this.buildAuthHeaders('GET', fullPath);
    headers['Accept'] = 'text/event-stream';
    const url = this.buildUrl('/api/agent/events', Object.keys(queryParams).length ? queryParams : undefined);

    this.openSseStream(url, headers, signal, (data) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed.type === 'string') {
          onEvent(parsed as Record<string, unknown> & { type: string });
        }
      } catch {
        // ignore malformed events
      }
    });
  }

  unsubscribeAgentEvents(): void {
    if (this.agentSseController) {
      this.agentSseController.abort();
      this.agentSseController = null;
    }
  }

  // -------------------------------------------------------------------------
  // SSE: Terminal stream
  // -------------------------------------------------------------------------

  subscribeTerminalStream(
    id: string,
    onData: TerminalDataCallback,
    onExit: TerminalExitCallback,
  ): void {
    if (this.terminalSseControllers.has(id)) {
      this.terminalSseControllers.get(id)!.abort();
    }
    const controller = new AbortController();
    this.terminalSseControllers.set(id, controller);
    const { signal } = controller;

    const path = `/api/terminal/stream/${encodeURIComponent(id)}`;
    const headers = this.buildAuthHeaders('GET', path);
    headers['Accept'] = 'text/event-stream';
    const url = this.buildUrl(path);

    this.openSseStream(url, headers, signal, (data) => {
      try {
        const parsed = JSON.parse(data) as { type?: string; data?: string };
        if (parsed.type === 'data' && typeof parsed.data === 'string') {
          onData(id, parsed.data);
        } else if (parsed.type === 'exit') {
          onExit(id);
          this.terminalSseControllers.delete(id);
        }
      } catch {
        // raw terminal data (non-JSON) — treat as output
        if (data) onData(id, data);
      }
    });
  }

  unsubscribeTerminalStream(id: string): void {
    const controller = this.terminalSseControllers.get(id);
    if (controller) {
      controller.abort();
      this.terminalSseControllers.delete(id);
    }
  }

  // -------------------------------------------------------------------------
  // Teardown
  // -------------------------------------------------------------------------

  destroy(): void {
    this.unsubscribeAgentEvents();
    for (const id of this.terminalSseControllers.keys()) {
      this.unsubscribeTerminalStream(id);
    }
  }

  // -------------------------------------------------------------------------
  // Internal SSE reader
  // -------------------------------------------------------------------------

  private openSseStream(
    url: string,
    headers: Record<string, string>,
    signal: AbortSignal,
    onLine: (data: string) => void,
  ): void {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const options: http.RequestOptions = {
      method: 'GET',
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers,
    };

    const connect = () => {
      if (signal.aborted) return;

      const req = transport.request(options, (res) => {
        if (signal.aborted) { res.destroy(); return; }

        let buffer = '';
        let currentData = '';

        res.setEncoding('utf-8');
        res.on('data', (chunk: string) => {
          if (signal.aborted) return;
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              currentData = line.slice(6);
            } else if (line === '' && currentData) {
              if (currentData !== ':keepalive') {
                onLine(currentData);
              }
              currentData = '';
            } else if (line.startsWith(':')) {
              // SSE comment/keepalive — ignore
              currentData = '';
            }
          }
        });

        res.on('end', () => {
          if (!signal.aborted) {
            // Reconnect after a short delay
            setTimeout(connect, 3000);
          }
        });

        res.on('error', () => {
          if (!signal.aborted) {
            setTimeout(connect, 5000);
          }
        });
      });

      req.on('error', () => {
        if (!signal.aborted) {
          setTimeout(connect, 5000);
        }
      });

      signal.addEventListener('abort', () => req.destroy());
      req.end();
    };

    connect();
  }
}
