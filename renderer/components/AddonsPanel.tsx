import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Puzzle, Download, Trash2, AlertCircle, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import './AddonsPanel.css';

interface AddonManifest {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  download: string;
  entrypoint: string;
  tags?: string[];
  platforms?: string[];
  minOmniCodeVersion?: string;
  repo?: string;
}

const REGISTRY_OWNER = 'GraysonBannister';
const REGISTRY_REPO = 'omni-addons';
const REGISTRY_DIR = 'addons';

export const AddonsPanel: React.FC = () => {
  const [registryAddons, setRegistryAddons] = useState<AddonManifest[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [loadingRegistry, setLoadingRegistry] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; msg: string } | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const addonsAPI = window.electronAPI?.addons;

  // ── Load installed add-ons ──────────────────────────────────────────────
  const loadInstalled = useCallback(async () => {
    if (!addonsAPI) return;
    try {
      const result = await addonsAPI.list();
      if (result.error) return;
      setInstalledIds(new Set(result.manifests.map((m) => m.id)));
    } catch {
      // silently ignore
    }
  }, [addonsAPI]);

  // ── Fetch registry from GitHub ─────────────────────────────────────────
  const fetchRegistry = useCallback(async () => {
    setLoadingRegistry(true);
    setRegistryError(null);
    try {
      const dirUrl = `https://api.github.com/repos/${REGISTRY_OWNER}/${REGISTRY_REPO}/contents/${REGISTRY_DIR}`;
      const dirRes = await fetch(dirUrl, {
        headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      });
      if (!dirRes.ok) throw new Error(`GitHub API: ${dirRes.status}`);

      const entries: Array<{ name: string; type: string; html_url: string }> = await dirRes.json();
      const dirs = entries.filter((e) => e.type === 'dir');

      const manifests = await Promise.all(
        dirs.map(async (dir) => {
          const mUrl = `https://api.github.com/repos/${REGISTRY_OWNER}/${REGISTRY_REPO}/contents/${REGISTRY_DIR}/${dir.name}/manifest.json`;
          const mRes = await fetch(mUrl, {
            headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
          });
          if (!mRes.ok) return null;
          const file = await mRes.json();
          const content = atob(file.content.replace(/\n/g, ''));
          return JSON.parse(content) as AddonManifest;
        })
      );

      setRegistryAddons(manifests.filter((m): m is AddonManifest => m !== null));
    } catch (err) {
      setRegistryError(err instanceof Error ? err.message : 'Failed to load registry');
    } finally {
      setLoadingRegistry(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistry();
    loadInstalled();
  }, [fetchRegistry, loadInstalled]);

  // ── Install ──────────────────────────────────────────────────────────────
  const install = async (manifest: AddonManifest) => {
    if (!addonsAPI) return;
    setActionInProgress(manifest.id);
    setActionError(null);
    try {
      const result = await addonsAPI.install(manifest);
      if (!result.success) {
        setActionError({ id: manifest.id, msg: result.error ?? 'Install failed' });
      } else {
        setSuccessId(manifest.id);
        setTimeout(() => setSuccessId(null), 2000);
        await loadInstalled();
      }
    } catch (err) {
      setActionError({ id: manifest.id, msg: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setActionInProgress(null);
    }
  };

  // ── Uninstall ────────────────────────────────────────────────────────────
  const uninstall = async (id: string) => {
    if (!addonsAPI) return;
    setActionInProgress(id);
    setActionError(null);
    try {
      const result = await addonsAPI.uninstall(id);
      if (!result.success) {
        setActionError({ id, msg: result.error ?? 'Uninstall failed' });
      } else {
        await loadInstalled();
      }
    } catch (err) {
      setActionError({ id, msg: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setActionInProgress(null);
    }
  };

  const installed = registryAddons.filter((a) => installedIds.has(a.id));
  const available = registryAddons.filter((a) => !installedIds.has(a.id));

  return (
    <div className="addons-panel">
      {/* Header */}
      <div className="addons-header">
        <span className="addons-title">Add-ons</span>
        <div className="addons-header-actions">
          <button
            className="addons-icon-btn"
            title="Refresh registry"
            onClick={() => { fetchRegistry(); loadInstalled(); }}
            disabled={loadingRegistry}
          >
            <RefreshCw size={13} className={loadingRegistry ? 'spinning' : ''} />
          </button>
          <a
            className="addons-icon-btn"
            href={`https://github.com/${REGISTRY_OWNER}/${REGISTRY_REPO}`}
            title="Open registry on GitHub"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      <div className="addons-content">
        {/* Error banner */}
        {registryError && (
          <div className="addons-error-banner">
            <AlertCircle size={12} />
            <span>{registryError}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loadingRegistry && registryAddons.length === 0 && (
          <div className="addons-loading">
            <Loader2 size={16} className="spinning" />
            <span>Loading registry…</span>
          </div>
        )}

        {/* No addons API */}
        {!addonsAPI && (
          <div className="addons-empty">
            <Puzzle size={24} />
            <span>Add-ons require Electron runtime</span>
          </div>
        )}

        {/* INSTALLED section */}
        {installed.length > 0 && (
          <Section label={`INSTALLED (${installed.length})`}>
            {installed.map((addon) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                installed
                inProgress={actionInProgress === addon.id}
                error={actionError?.id === addon.id ? actionError.msg : null}
                success={successId === addon.id}
                onUninstall={() => uninstall(addon.id)}
              />
            ))}
          </Section>
        )}

        {/* AVAILABLE section */}
        {available.length > 0 && (
          <Section label={`AVAILABLE (${available.length})`}>
            {available.map((addon) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                installed={false}
                inProgress={actionInProgress === addon.id}
                error={actionError?.id === addon.id ? actionError.msg : null}
                success={successId === addon.id}
                onInstall={() => install(addon)}
              />
            ))}
          </Section>
        )}

        {/* Empty state after load */}
        {!loadingRegistry && registryAddons.length === 0 && !registryError && (
          <div className="addons-empty">
            <Puzzle size={24} />
            <span>No add-ons found in the registry</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="addons-section">
      <button className="addons-section-header" onClick={() => setOpen((o) => !o)}>
        <span className="addons-section-chevron">{open ? '▾' : '▸'}</span>
        <span className="addons-section-label">{label}</span>
      </button>
      {open && <div className="addons-section-body">{children}</div>}
    </div>
  );
}

interface AddonCardProps {
  addon: AddonManifest;
  installed: boolean;
  inProgress: boolean;
  error: string | null;
  success: boolean;
  onInstall?: () => void;
  onUninstall?: () => void;
}

function AddonCard({ addon, installed, inProgress, error, success, onInstall, onUninstall }: AddonCardProps) {
  return (
    <div className={`addon-card ${error ? 'addon-card--error' : ''}`}>
      <div className="addon-card-top">
        <div className="addon-card-info">
          <span className="addon-card-name">{addon.name}</span>
          <span className="addon-card-version">v{addon.version}</span>
        </div>
        <div className="addon-card-actions">
          {addon.repo && (
            <a
              className="addon-action-btn addon-action-btn--link"
              href={addon.repo}
              target="_blank"
              rel="noopener noreferrer"
              title="View source"
            >
              <ExternalLink size={11} />
            </a>
          )}
          {installed ? (
            <button
              className="addon-action-btn addon-action-btn--remove"
              title="Remove add-on"
              onClick={onUninstall}
              disabled={inProgress}
            >
              {inProgress ? <Loader2 size={12} className="spinning" /> : <Trash2 size={12} />}
            </button>
          ) : (
            <button
              className="addon-action-btn addon-action-btn--install"
              title="Install add-on"
              onClick={onInstall}
              disabled={inProgress}
            >
              {inProgress ? (
                <Loader2 size={12} className="spinning" />
              ) : success ? (
                <CheckCircle2 size={12} />
              ) : (
                <Download size={12} />
              )}
            </button>
          )}
        </div>
      </div>

      <p className="addon-card-desc">{addon.description}</p>

      {addon.tags && addon.tags.length > 0 && (
        <div className="addon-card-tags">
          {addon.tags.map((tag) => (
            <span key={tag} className="addon-tag">{tag}</span>
          ))}
        </div>
      )}

      {error && (
        <div className="addon-card-error">
          <AlertCircle size={11} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
