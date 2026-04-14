// Remote Event Emitter - Bridges AgentBridge events to SSE connections
// Allows mobile app to receive real-time streaming updates

import type { Response } from 'express';
import { agentBridge, type ConversationAgentEvent } from './agent-bridge.js';

// Active SSE connections by conversation ID
const connections = new Map<string, Set<Response>>();

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

  console.log('[RemoteEventEmitter] Cleaned up all connections');
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
    // Log ALL event types that have no SSE connections — not just user_message —
    // so we can diagnose whether the connection is missing during streaming.
    console.log(`[RemoteEventEmitter] Event ${event.type} has no SSE connections for conversation ${conversationId}. Active conversations: [${Array.from(connections.keys()).join(', ')}]`);
    return; // No connections for this conversation
  }

  // Log every event type being broadcast for debugging SSE delivery issues
  console.log(`[RemoteEventEmitter] Broadcasting ${event.type} to ${responseSet.size} SSE connection(s) for conversation ${conversationId}`);

  const sseData = `data: ${JSON.stringify(eventData)}\n\n`;

  // Send to all connections for this conversation
  Array.from(responseSet).forEach((res) => {
    try {
      const ok = res.write(sseData);
      if (!ok) {
        console.warn(`[RemoteEventEmitter] Backpressure on SSE write for ${event.type} (conversation ${conversationId}) — buffer full`);
      }
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
