// WebSocket transport for real-time event delivery to mobile clients.
// Replaces SSE for mobile because Cloudflare tunnels buffer SSE responses
// but properly proxy WebSocket connections.

import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import type { Server } from 'node:http';
import * as crypto from 'node:crypto';
import { settingsManager } from './settings.js';
import { agentBridge, type ConversationAgentEvent } from './agent-bridge.js';
import { registerTerminalCallback, unregisterTerminalCallback, getTerminalBuffer } from './terminal-manager.js';

// ── Types ──

interface ClientState {
  ws: WebSocket;
  agentSubscription?: string;
  terminalSubscription?: string;
  terminalCallback?: (data: string) => void;
  alive: boolean;
}

// ── State ──

let wss: WebSocketServer | null = null;
let unsubscribeAgent: (() => void) | null = null;
let pingInterval: ReturnType<typeof setInterval> | null = null;

const agentClients = new Map<string, Set<ClientState>>();
const allClients = new Set<ClientState>();

// ── Auth ──

function authenticateUpgrade(req: IncomingMessage): boolean {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  const timestamp = req.headers['x-timestamp'] as string | undefined;
  const signature = req.headers['x-signature'] as string | undefined;

  if (!apiKey || !timestamp || !signature) return false;

  const storedKey = settingsManager.get('remoteAccess.apiKey') as string | null;
  if (!storedKey) return false;

  if (!timingSafeEqual(apiKey, storedKey)) return false;

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) return false;

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathWithQuery = url.pathname + (url.search || '');
  const signingString = `GET\n${pathWithQuery}\n${timestamp}`;
  const expected = crypto.createHmac('sha256', storedKey).update(signingString).digest('hex');

  return timingSafeEqual(signature, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.alloc(bufA.length, 0);
    crypto.timingSafeEqual(bufA, bufB);
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ── Broadcast ──

function broadcastAgentEvent(event: ConversationAgentEvent): void {
  const { conversationId, ...eventData } = event;
  const clients = agentClients.get(conversationId);
  if (!clients || clients.size === 0) return;

  const payload = JSON.stringify(eventData);
  Array.from(clients).forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

// ── Client message handling ──

function handleClientMessage(client: ClientState, raw: string): void {
  let msg: { type: string; channel?: string; conversationId?: string; terminalId?: string };
  try {
    msg = JSON.parse(raw);
  } catch {
    client.ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
    return;
  }

  if (msg.type === 'subscribe') {
    if (msg.channel === 'agent' && msg.conversationId) {
      unsubscribeFromAgent(client);
      unsubscribeFromTerminal(client);

      client.agentSubscription = msg.conversationId;
      if (!agentClients.has(msg.conversationId)) {
        agentClients.set(msg.conversationId, new Set());
      }
      agentClients.get(msg.conversationId)!.add(client);

      client.ws.send(JSON.stringify({ type: 'subscribed', channel: 'agent', conversationId: msg.conversationId }));
      console.log(`[RemoteWS] Client subscribed to agent conversation ${msg.conversationId}`);

    } else if (msg.channel === 'terminal' && msg.terminalId) {
      unsubscribeFromAgent(client);
      unsubscribeFromTerminal(client);

      client.terminalSubscription = msg.terminalId;

      const buffered = getTerminalBuffer(msg.terminalId);
      if (buffered.length > 0) {
        client.ws.send(JSON.stringify({ type: 'stream_delta', delta: { text: buffered } }));
      }

      const cb = (data: string) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({ type: 'stream_delta', delta: { text: data } }));
        }
      };
      client.terminalCallback = cb;
      registerTerminalCallback(msg.terminalId, cb);

      client.ws.send(JSON.stringify({ type: 'subscribed', channel: 'terminal', terminalId: msg.terminalId }));
      console.log(`[RemoteWS] Client subscribed to terminal ${msg.terminalId}`);
    }
  } else if (msg.type === 'unsubscribe') {
    unsubscribeFromAgent(client);
    unsubscribeFromTerminal(client);
    client.ws.send(JSON.stringify({ type: 'unsubscribed' }));
  }
}

function unsubscribeFromAgent(client: ClientState): void {
  if (client.agentSubscription) {
    const set = agentClients.get(client.agentSubscription);
    if (set) {
      set.delete(client);
      if (set.size === 0) agentClients.delete(client.agentSubscription);
    }
    client.agentSubscription = undefined;
  }
}

function unsubscribeFromTerminal(client: ClientState): void {
  if (client.terminalSubscription && client.terminalCallback) {
    unregisterTerminalCallback(client.terminalSubscription, client.terminalCallback);
    client.terminalSubscription = undefined;
    client.terminalCallback = undefined;
  }
}

function removeClient(client: ClientState): void {
  unsubscribeFromAgent(client);
  unsubscribeFromTerminal(client);
  allClients.delete(client);
}

// ── Public API ──

export function initializeWebSocketServer(httpServer: Server): void {
  if (wss) return;

  wss = new WebSocketServer({
    noServer: true,
  });

  httpServer.on('upgrade', (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname !== '/api/ws') {
      socket.destroy();
      return;
    }

    if (!authenticateUpgrade(req)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      console.log('[RemoteWS] Rejected unauthenticated WebSocket upgrade');
      return;
    }

    wss!.handleUpgrade(req, socket, head, (ws) => {
      wss!.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    const client: ClientState = { ws, alive: true };
    allClients.add(client);
    console.log(`[RemoteWS] Client connected (total: ${allClients.size})`);

    ws.on('pong', () => { client.alive = true; });

    ws.on('message', (data) => {
      handleClientMessage(client, data.toString());
    });

    ws.on('close', () => {
      removeClient(client);
      console.log(`[RemoteWS] Client disconnected (total: ${allClients.size})`);
    });

    ws.on('error', () => {
      removeClient(client);
    });
  });

  // Ping every 25 seconds; terminate dead connections
  pingInterval = setInterval(() => {
    Array.from(allClients).forEach((client) => {
      if (!client.alive) {
        console.log('[RemoteWS] Terminating unresponsive client');
        client.ws.terminate();
        removeClient(client);
        return;
      }
      client.alive = false;
      client.ws.ping();
    });
  }, 25000);

  unsubscribeAgent = agentBridge.onEvent((event: ConversationAgentEvent) => {
    broadcastAgentEvent(event);
  });

  console.log('[RemoteWS] WebSocket server initialized');
}

export function cleanupWebSocketServer(): void {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }

  if (unsubscribeAgent) {
    unsubscribeAgent();
    unsubscribeAgent = null;
  }

  Array.from(allClients).forEach((client) => {
    try {
      client.ws.close(1001, 'Server shutting down');
    } catch {
      // ignore
    }
  });
  allClients.clear();
  agentClients.clear();

  if (wss) {
    wss.close();
    wss = null;
  }

  console.log('[RemoteWS] WebSocket server cleaned up');
}

export function getWebSocketStats(): { totalClients: number; agentSubscriptions: number } {
  return {
    totalClients: allClients.size,
    agentSubscriptions: agentClients.size,
  };
}
