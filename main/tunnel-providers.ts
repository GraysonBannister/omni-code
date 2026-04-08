// Tunnel Provider Abstraction
// Wraps ngrok, Cloudflare Tunnel (cloudflared), localtunnel, and a no-op
// behind a single interface so remote-server.ts is decoupled from the choice.

import * as ngrok from '@ngrok/ngrok';
import { Tunnel as CloudflaredTunnel } from 'cloudflared';

export interface TunnelProvider {
  start(port: number): Promise<string>;
  stop(): Promise<void>;
}

// ─── ngrok ────────────────────────────────────────────────────────────────────

export class NgrokProvider implements TunnelProvider {
  private listener: ngrok.Listener | null = null;

  constructor(private readonly authToken: string) {}

  async start(port: number): Promise<string> {
    this.listener = await ngrok.forward({
      addr: port,
      authtoken: this.authToken,
    });
    const url = this.listener.url();
    if (!url) throw new Error('ngrok did not return a URL');
    return url;
  }

  async stop(): Promise<void> {
    if (this.listener) {
      try {
        await this.listener.close();
      } catch {
        // ignore errors on close
      }
      this.listener = null;
    }
  }
}

// ─── Cloudflare Tunnel (cloudflared) ─────────────────────────────────────────

export class CloudflaredProvider implements TunnelProvider {
  private tunnelInstance: CloudflaredTunnel | null = null;

  constructor(private readonly token?: string) {}

  async start(port: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const t = this.token
        ? CloudflaredTunnel.withToken(this.token)
        : CloudflaredTunnel.quick(`http://localhost:${port}`);

      this.tunnelInstance = t;

      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for Cloudflare Tunnel URL (30s)'));
      }, 30_000);

      t.once('url', (url: string) => {
        clearTimeout(timeout);
        resolve(url);
      });

      t.once('error', (err: Error) => {
        clearTimeout(timeout);
        reject(err);
      });

      t.once('exit', (code: number | null) => {
        clearTimeout(timeout);
        reject(new Error(`cloudflared exited unexpectedly (code ${code})`));
      });
    });
  }

  async stop(): Promise<void> {
    if (this.tunnelInstance) {
      try {
        this.tunnelInstance.stop();
      } catch {
        // ignore
      }
      this.tunnelInstance = null;
    }
  }
}

// ─── localtunnel ─────────────────────────────────────────────────────────────

interface LocaltunnelClient {
  url: string;
  close(): void;
}

export class LocaltunnelProvider implements TunnelProvider {
  private client: LocaltunnelClient | null = null;

  async start(port: number): Promise<string> {
    // localtunnel is CJS with a default export; use dynamic import to stay compatible
    const mod = await import('localtunnel');
    const lt = (mod.default ?? mod) as (opts: { port: number }) => Promise<LocaltunnelClient>;
    this.client = await lt({ port });
    return this.client.url;
  }

  async stop(): Promise<void> {
    if (this.client) {
      try {
        this.client.close();
      } catch {
        // ignore
      }
      this.client = null;
    }
  }
}

// ─── None (local-only) ───────────────────────────────────────────────────────

export class NoneProvider implements TunnelProvider {
  async start(port: number): Promise<string> {
    return `http://localhost:${port}`;
  }

  async stop(): Promise<void> {
    // nothing to clean up
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export type TunnelProviderType = 'ngrok' | 'cloudflared' | 'localtunnel' | 'none';

export interface TunnelProviderSettings {
  tunnelProvider: TunnelProviderType;
  ngrokAuthToken?: string;
  cloudflaredToken?: string;
}

export function createTunnelProvider(settings: TunnelProviderSettings): TunnelProvider {
  switch (settings.tunnelProvider) {
    case 'ngrok': {
      if (!settings.ngrokAuthToken) {
        console.warn('[TunnelProviders] No ngrok auth token configured — falling back to local-only');
        return new NoneProvider();
      }
      return new NgrokProvider(settings.ngrokAuthToken);
    }
    case 'cloudflared':
      return new CloudflaredProvider(settings.cloudflaredToken || undefined);
    case 'localtunnel':
      return new LocaltunnelProvider();
    case 'none':
    default:
      return new NoneProvider();
  }
}
