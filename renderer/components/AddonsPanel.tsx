import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Puzzle, Download, Trash2, AlertCircle, ExternalLink, CheckCircle2, Loader2, ArrowUpCircle, HelpCircle, X, Wrench, Zap, Filter, ChevronRight } from 'lucide-react';
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

/** Returns true if registryVer is strictly greater than installedVer (semver). */
function isNewerVersion(registryVer: string, installedVer: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const rv = parse(registryVer);
  const iv = parse(installedVer);
  for (let i = 0; i < Math.max(rv.length, iv.length); i++) {
    const r = rv[i] ?? 0;
    const ins = iv[i] ?? 0;
    if (r > ins) return true;
    if (r < ins) return false;
  }
  return false;
}

export const AddonsPanel: React.FC = () => {
  const [registryAddons, setRegistryAddons] = useState<AddonManifest[]>([]);
  const [installedManifests, setInstalledManifests] = useState<Map<string, AddonManifest>>(new Map());
  const [loadingRegistry, setLoadingRegistry] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; msg: string } | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const addonsAPI = window.electronAPI?.addons;

  // ── Load installed add-ons ──────────────────────────────────────────────
  const loadInstalled = useCallback(async () => {
    if (!addonsAPI) return;
    try {
      const result = await addonsAPI.list();
      if (result.error) return;
      setInstalledManifests(new Map(result.manifests.map((m) => [m.id, m])));
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

  const installed = registryAddons.filter((a) => installedManifests.has(a.id));
  const available = registryAddons.filter((a) => !installedManifests.has(a.id));
  const updateCount = installed.filter((a) => {
    const local = installedManifests.get(a.id);
    return local && isNewerVersion(a.version, local.version);
  }).length;

  return (
    <div className="addons-panel">
      {showInfo && <AddonInfoModal onClose={() => setShowInfo(false)} />}
      {/* Header */}
      <div className="addons-header">
        <span className="addons-title">Add-ons</span>
        <div className="addons-header-actions">
          <button
            className="addons-icon-btn"
            title="How add-ons work"
            onClick={() => setShowInfo(true)}
          >
            <HelpCircle size={13} />
          </button>
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
          <Section
            label={
              updateCount > 0
                ? `INSTALLED (${installed.length}) · ${updateCount} update${updateCount > 1 ? 's' : ''}`
                : `INSTALLED (${installed.length})`
            }
            hasUpdates={updateCount > 0}
          >
            {installed.map((addon) => {
              const localManifest = installedManifests.get(addon.id);
              const hasUpdate = localManifest ? isNewerVersion(addon.version, localManifest.version) : false;
              return (
                <AddonCard
                  key={addon.id}
                  addon={addon}
                  installed
                  installedVersion={localManifest?.version}
                  hasUpdate={hasUpdate}
                  inProgress={actionInProgress === addon.id}
                  error={actionError?.id === addon.id ? actionError.msg : null}
                  success={successId === addon.id}
                  onUpdate={hasUpdate ? () => install(addon) : undefined}
                  onUninstall={() => uninstall(addon.id)}
                />
              );
            })}
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

function Section({ label, children, hasUpdates }: { label: string; children: React.ReactNode; hasUpdates?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="addons-section">
      <button className="addons-section-header" onClick={() => setOpen((o) => !o)}>
        <span className="addons-section-chevron">{open ? '▾' : '▸'}</span>
        <span className="addons-section-label">{label}</span>
        {hasUpdates && <span className="addons-update-dot" title="Updates available" />}
      </button>
      {open && <div className="addons-section-body">{children}</div>}
    </div>
  );
}

interface AddonCardProps {
  addon: AddonManifest;
  installed: boolean;
  installedVersion?: string;
  hasUpdate?: boolean;
  inProgress: boolean;
  error: string | null;
  success: boolean;
  onInstall?: () => void;
  onUpdate?: () => void;
  onUninstall?: () => void;
}

const INDEX_JS_SKELETON = `function activate(context) {
  // Register a new tool
  context.registerTool({
    name: 'MyTool',
    description: 'What this tool does',
    inputSchema: { type: 'object', properties: {} },
    async execute(input, ctx) {
      return { content: 'result' };
    },
  });

  // Or add instructions to the system prompt
  context.registerSystemPromptFragment(
    'Always respond in bullet points.'
  );

  // Or compress noisy tool output
  context.registerToolOutputFilter((toolName, output) => {
    return output.slice(0, 2000); // trim long output
  });
}

function deactivate() {}

module.exports = { activate, deactivate };`;

function AddonInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="addons-info-overlay" onClick={onClose}>
      <div className="addons-info-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="addons-info-header">
          <span className="addons-info-title">How Add-ons Work</span>
          <button className="addons-info-close" onClick={onClose} title="Close">
            <X size={14} />
          </button>
        </div>

        <div className="addons-info-body">
          {/* Section 1: How they work */}
          <div className="addons-info-section">
            <div className="addons-info-bullets">
              <div className="addons-info-bullet">
                <span className="addons-info-bullet-icon"><Wrench size={13} /></span>
                <span>Add-ons are Node.js modules loaded at startup. They live in <code>~/Library/Application Support/Omni Code/addons/</code> and are managed by the registry above.</span>
              </div>
              <div className="addons-info-bullet">
                <span className="addons-info-bullet-icon"><Zap size={13} /></span>
                <span>Each addon can register <strong>tools</strong> (new agent capabilities), <strong>system prompt fragments</strong> (extra instructions injected into every conversation), or <strong>output filters</strong> (compress/transform tool results before they enter the context).</span>
              </div>
              <div className="addons-info-bullet">
                <span className="addons-info-bullet-icon"><Filter size={13} /></span>
                <span>Installed add-ons are automatically checked for updates whenever the registry is refreshed. Click the update button on any card to reinstall the latest version.</span>
              </div>
            </div>
          </div>

          <div className="addons-info-divider">
            <span>Build Your Own</span>
          </div>

          {/* Section 2: Build your own */}
          <div className="addons-info-section">
            <ol className="addons-info-steps">
              <li>
                <strong>Create a GitHub repo</strong> with three files: <code>index.js</code>, <code>manifest.json</code>, and <code>README.md</code>.
              </li>
              <li>
                <strong>Export <code>activate(context)</code></strong> from <code>index.js</code>. Use the context API to register tools, prompt fragments, or output filters:
              </li>
            </ol>

            <pre className="addons-info-code">{INDEX_JS_SKELETON}</pre>

            <ol className="addons-info-steps" start={3}>
              <li>
                <strong>Submit a PR</strong> to the registry repo adding a folder under <code>addons/</code> containing only your <code>manifest.json</code> (pointing to your repo via the <code>repo</code> and <code>download</code> fields). Once merged, your add-on appears in the browser for everyone.
              </li>
            </ol>

            <div className="addons-info-actions">
              <a
                className="addons-info-btn"
                href="https://github.com/GraysonBannister/omni-terse"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={11} />
                View example addon
              </a>
              <a
                className="addons-info-btn addons-info-btn--primary"
                href={`https://github.com/${REGISTRY_OWNER}/${REGISTRY_REPO}/compare`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Submit PR
                <ChevronRight size={11} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddonCard({ addon, installed, installedVersion, hasUpdate, inProgress, error, success, onInstall, onUpdate, onUninstall }: AddonCardProps) {
  return (
    <div className={`addon-card ${error ? 'addon-card--error' : ''} ${hasUpdate ? 'addon-card--has-update' : ''}`}>
      <div className="addon-card-top">
        <div className="addon-card-info">
          <span className="addon-card-name">{addon.name}</span>
          {installed && hasUpdate && installedVersion ? (
            <span className="addon-card-version addon-version-update" title={`Update available: v${installedVersion} → v${addon.version}`}>
              <span className="addon-version-old">v{installedVersion}</span>
              <span className="addon-version-arrow">→</span>
              <span className="addon-version-new">v{addon.version}</span>
            </span>
          ) : (
            <span className="addon-card-version">v{addon.version}</span>
          )}
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
            <>
              {hasUpdate && (
                <button
                  className="addon-action-btn addon-action-btn--update"
                  title={`Update to v${addon.version}`}
                  onClick={onUpdate}
                  disabled={inProgress}
                >
                  {inProgress ? <Loader2 size={12} className="spinning" /> : <ArrowUpCircle size={12} />}
                </button>
              )}
              <button
                className="addon-action-btn addon-action-btn--remove"
                title="Remove add-on"
                onClick={onUninstall}
                disabled={inProgress}
              >
                {inProgress && !hasUpdate ? <Loader2 size={12} className="spinning" /> : <Trash2 size={12} />}
              </button>
            </>
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
