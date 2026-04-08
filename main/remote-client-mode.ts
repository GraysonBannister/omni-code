// Remote Client Mode - Singleton that manages a connection to a remote omni-code server
// When active, agent/file/terminal IPC calls are delegated to the remote server.

import { BrowserWindow } from 'electron';
import { RemoteClient } from './remote-client.js';
import type { RemoteServerInfo } from './remote-client.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RemoteClientStatus {
  connected: boolean;
  url: string | null;
  serverInfo: RemoteServerInfo | null;
  error: string | null;
}

export interface RemoteClientConnectResult {
  success: boolean;
  error?: string;
  serverInfo?: RemoteServerInfo;
}

export interface RemoteClientTestResult {
  success: boolean;
  error?: string;
  serverInfo?: RemoteServerInfo;
}

// ---------------------------------------------------------------------------
// RemoteClientMode singleton
// ---------------------------------------------------------------------------

class RemoteClientMode {
  private client: RemoteClient | null = null;
  private connected = false;
  private url: string | null = null;
  private serverInfo: RemoteServerInfo | null = null;
  private lastError: string | null = null;

  // -------------------------------------------------------------------------
  // Connection lifecycle
  // -------------------------------------------------------------------------

  async connect(url: string, apiKey: string): Promise<RemoteClientConnectResult> {
    // Tear down any existing connection first
    await this.disconnect();

    try {
      const candidate = new RemoteClient({ baseUrl: url, apiKey });
      const test = await candidate.testConnection();

      if (!test.success) {
        return { success: false, error: test.error ?? 'Connection failed' };
      }

      this.client = candidate;
      this.connected = true;
      this.url = url;
      this.serverInfo = test.info ?? null;
      this.lastError = null;

      // Start listening for agent events and re-broadcast to all renderer windows
      this.client.subscribeAgentEvents((event) => {
        this.broadcastToRenderers('agent:event', event);
      });

      console.log('[RemoteClientMode] Connected to remote server:', url);

      // Notify renderer that connection state changed
      this.broadcastToRenderers('remote-client:status-changed', this.getStatus());

      return { success: true, serverInfo: test.info };
    } catch (err) {
      const message = (err as Error).message;
      this.lastError = message;
      console.error('[RemoteClientMode] Connection failed:', message);
      return { success: false, error: message };
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    const wasConnected = this.connected;
    this.connected = false;
    this.url = null;
    this.serverInfo = null;
    this.lastError = null;

    if (wasConnected) {
      console.log('[RemoteClientMode] Disconnected from remote server');
      this.broadcastToRenderers('remote-client:status-changed', this.getStatus());
    }
  }

  // -------------------------------------------------------------------------
  // Introspection
  // -------------------------------------------------------------------------

  isActive(): boolean {
    return this.connected && this.client !== null;
  }

  getClient(): RemoteClient | null {
    return this.client;
  }

  getStatus(): RemoteClientStatus {
    return {
      connected: this.connected,
      url: this.url,
      serverInfo: this.serverInfo,
      error: this.lastError,
    };
  }

  // -------------------------------------------------------------------------
  // Terminal stream bridging
  // -------------------------------------------------------------------------

  /**
   * Subscribe to a remote terminal stream and forward data to the renderer.
   * Call this after createTerminal() to start receiving output.
   */
  subscribeTerminalStream(id: string): void {
    if (!this.client) return;

    this.client.subscribeTerminalStream(
      id,
      (terminalId, data) => {
        this.broadcastToRenderers('terminal:data', { id: terminalId, data });
      },
      (terminalId) => {
        this.broadcastToRenderers('terminal:exit', { id: terminalId });
      },
    );
  }

  unsubscribeTerminalStream(id: string): void {
    this.client?.unsubscribeTerminalStream(id);
  }

  // -------------------------------------------------------------------------
  // IPC broadcast helper
  // -------------------------------------------------------------------------

  private broadcastToRenderers(channel: string, payload: unknown): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, payload);
      }
    }
  }
}

// Export singleton
export const remoteClientMode = new RemoteClientMode();
