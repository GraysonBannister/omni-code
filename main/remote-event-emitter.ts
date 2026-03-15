// Remote Event Emitter - Bridges AgentBridge events to SSE connections
// Allows mobile app to receive real-time streaming updates

import type { Response } from 'express';
import { agentBridge, type ConversationAgentEvent } from './agent-bridge.js';

// Active SSE connections by conversation ID
const connections = new Map<string, Set<Response>>();

// Global sync connections (receive conversation lifecycle events)
const syncConnections = new Set<Response>();

// Sync event types for conversation lifecycle
export type SyncEventType = 'conversation_created' | 'conversation_updated' | 'conversation_deleted';

export interface ConversationSyncEvent {
  type: SyncEventType;
  conversationId: string;
  title?: string;
  messageCount?: number;
  updatedAt?: number;
}

// Unsubscribe function from AgentBridge
let unsubscribe: (() => void) | null = null;

/**
 * Initialize the event emitter by subscribing to AgentBridge events
 */
export function initializeEventEmitter(): void {
  if (unsubscribe) {
    // Already initialized
    return;
  }

  unsubscribe = agentBridge.onEvent((event: ConversationAgentEvent) => {
    broadcastEvent(event);
  });

  console.log('[RemoteEventEmitter] Initialized and subscribed to AgentBridge events');
}

/**
 * Cleanup the event emitter
 */
export function cleanupEventEmitter(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  // Close all active connections
  Array.from(connections.entries()).forEach(([conversationId, responseSet]) => {
    Array.from(responseSet).forEach((res) => {
      try {
        res.end();
      } catch {
        // Ignore errors on close
      }
    });
    responseSet.clear();
  });
  connections.clear();

  // Close all sync connections
  Array.from(syncConnections).forEach((res) => {
    try { res.end(); } catch { /* ignore */ }
  });
  syncConnections.clear();

  console.log('[RemoteEventEmitter] Cleaned up all connections');
}

/**
 * Register a global sync SSE connection (receives conversation lifecycle events)
 */
export function registerSyncConnection(res: Response): void {
  syncConnections.add(res);
  console.log(`[RemoteEventEmitter] Registered sync connection (total: ${syncConnections.size})`);

  res.on('close', () => {
    syncConnections.delete(res);
    console.log(`[RemoteEventEmitter] Sync connection closed (remaining: ${syncConnections.size})`);
  });
  res.on('error', () => {
    syncConnections.delete(res);
  });
}

/**
 * Broadcast a conversation lifecycle sync event to all sync connections
 */
export function broadcastSyncEvent(event: ConversationSyncEvent): void {
  if (syncConnections.size === 0) return;

  const sseData = `data: ${JSON.stringify(event)}\n\n`;
  Array.from(syncConnections).forEach((res) => {
    try {
      res.write(sseData);
    } catch {
      syncConnections.delete(res);
    }
  });
  console.log(`[RemoteEventEmitter] Broadcast sync event: ${event.type} for ${event.conversationId}`);
}

/**
 * Register an SSE connection for a specific conversation
 */
export function registerConnection(conversationId: string, res: Response): void {
  if (!connections.has(conversationId)) {
    connections.set(conversationId, new Set());
  }

  const responseSet = connections.get(conversationId)!;
  responseSet.add(res);

  console.log(`[RemoteEventEmitter] Registered connection for conversation ${conversationId}`);

  // Handle client disconnect
  res.on('close', () => {
    unregisterConnection(conversationId, res);
  });

  res.on('error', () => {
    unregisterConnection(conversationId, res);
  });
}

/**
 * Unregister an SSE connection
 */
export function unregisterConnection(conversationId: string, res: Response): void {
  const responseSet = connections.get(conversationId);
  if (responseSet) {
    responseSet.delete(res);

    // Clean up empty sets
    if (responseSet.size === 0) {
      connections.delete(conversationId);
    }

    console.log(`[RemoteEventEmitter] Unregistered connection for conversation ${conversationId}`);
  }
}

/**
 * Broadcast an event to all connections for the relevant conversation
 */
function broadcastEvent(event: ConversationAgentEvent): void {
  const { conversationId, ...eventData } = event;

  const responseSet = connections.get(conversationId);
  if (!responseSet || responseSet.size === 0) {
    return; // No connections for this conversation
  }

  const sseData = `data: ${JSON.stringify(eventData)}\n\n`;

  // Send to all connections for this conversation
  Array.from(responseSet).forEach((res) => {
    try {
      res.write(sseData);
    } catch (error) {
      console.error(`[RemoteEventEmitter] Failed to send event to conversation ${conversationId}:`, error);
      // Remove failed connection
      responseSet.delete(res);
    }
  });
}

/**
 * Get active connection count (for status/debugging)
 */
export function getConnectionStats(): {
  totalConversations: number;
  totalConnections: number;
  conversations: string[];
} {
  let totalConnections = 0;
  const conversationIds: string[] = [];

  Array.from(connections.entries()).forEach(([conversationId, responseSet]) => {
    conversationIds.push(conversationId);
    totalConnections += responseSet.size;
  });

  return {
    totalConversations: connections.size,
    totalConnections,
    conversations: conversationIds,
  };
}
