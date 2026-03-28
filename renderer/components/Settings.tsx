import React, { useState, useEffect, useCallback } from 'react';
import { X, Settings as SettingsIcon, Cpu, Check, CheckCircle2, Globe, Play, Square, RefreshCw, Copy } from 'lucide-react';
import { useSettingsStore, defaultSettings } from '../stores/settingsStore';
import { useAppStore } from '../stores/appStore';
import { SettingToggle } from './settings/SettingToggle';
import { SettingSelect } from './settings/SettingSelect';
import { SettingInput } from './settings/SettingInput';
import { UsageDashboard } from './UsageDashboard';
import './Settings.css';

type TabId = 'general' | 'editor' | 'ai' | 'apiKeys' | 'shortcuts' | 'files' | 'indexing' | 'privacy' | 'usage' | 'remote';

interface SettingsPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'editor', label: 'Editor' },
  { id: 'ai', label: 'AI' },
  { id: 'apiKeys', label: 'API Keys' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'files', label: 'Files' },
  { id: 'indexing', label: 'Indexing' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'usage', label: 'Usage' },
  { id: 'remote', label: 'Remote' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen = true, onClose, embedded = false }) => {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [isLoading, setIsLoading] = useState(false);
  const { settings, loadSettings, setSetting, resetSetting } = useSettingsStore();
  const { availableModels, availableProviders, setModel } = useAppStore();

  // Remote server state
  const [remoteStatus, setRemoteStatus] = useState<{
    running: boolean;
    url: string | null;
    apiKey: string | null;
    port: number;
    connections: {
      totalConversations: number;
      totalConnections: number;
      conversations: string[];
    };
  } | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);

  // QR code state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Load settings when panel opens or when embedded
  useEffect(() => {
    if ((isOpen || embedded) && !settings) {
      loadSettings();
    }
  }, [isOpen, embedded, settings, loadSettings]);

  // Handle keyboard shortcut to close (only in modal mode)
  useEffect(() => {
    if (embedded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, embedded]);

  // Load remote server status when remote tab is active
  useEffect(() => {
    if (activeTab === 'remote') {
      loadRemoteStatus();
    }
  }, [activeTab]);

  const loadRemoteStatus = async () => {
    try {
      const status = await window.electronAPI?.remote?.status();
      if (status) {
        setRemoteStatus(status);
      }
    } catch (error) {
      console.error('Failed to load remote status:', error);
    }
  };

  const handleRemoteStart = async () => {
    setRemoteLoading(true);
    try {
      const result = await window.electronAPI?.remote?.start();
      if (result?.success) {
        setRemoteStatus({
          running: true,
          url: result.url || null,
          apiKey: result.apiKey || null,
          port: settings?.remoteAccess?.port || 3000,
          connections: { totalConversations: 0, totalConnections: 0, conversations: [] },
        });
      }
    } catch (error) {
      console.error('Failed to start remote server:', error);
    }
    setRemoteLoading(false);
  };

  const handleRemoteStop = async () => {
    setRemoteLoading(true);
    try {
      const result = await window.electronAPI?.remote?.stop();
      if (result?.success) {
        setRemoteStatus({
          running: false,
          url: null,
          apiKey: remoteStatus?.apiKey || null,
          port: settings?.remoteAccess?.port || 3000,
          connections: { totalConversations: 0, totalConnections: 0, conversations: [] },
        });
      }
    } catch (error) {
      console.error('Failed to stop remote server:', error);
    }
    setRemoteLoading(false);
  };

  const handleRegenerateApiKey = async () => {
    try {
      const result = await window.electronAPI?.remote?.regenerateApiKey();
      if (result?.success && result.apiKey) {
        setSetting('remoteAccess.apiKey', result.apiKey);
        setRemoteStatus(prev => prev ? { ...prev, apiKey: result.apiKey } : null);
        // Clear existing QR code since API key changed
        setQrCodeDataUrl(null);
      }
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
    }
  };

  const handleGenerateQR = async () => {
    setQrLoading(true);
    try {
      const result = await window.electronAPI?.remote?.generateQR();
      if (result?.success && result.qrCodeDataUrl) {
        setQrCodeDataUrl(result.qrCodeDataUrl);
      } else {
        console.error('Failed to generate QR code:', result?.error);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
    setQrLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!embedded && !isOpen) return null;

  const handleReset = async (path?: string) => {
    setIsLoading(true);
    await resetSetting(path);
    setIsLoading(false);
  };

  const currentSettings = settings || defaultSettings;

  // API Key validation helper
  const validateApiKey = useCallback((provider: string, key: string): boolean => {
    if (!key || key.trim().length < 10) return false;

    const trimmed = key.trim();

    switch (provider) {
      case 'anthropic':
        return trimmed.startsWith('sk-ant-');
      case 'openai':
        return trimmed.startsWith('sk-') || trimmed.startsWith('sk-proj-');
      case 'google':
        return trimmed.startsWith('AIza');
      case 'groq':
        return trimmed.startsWith('gsk_');
      case 'together':
        return trimmed.startsWith('together-') || trimmed.startsWith('tg-');
      case 'xai':
        return trimmed.startsWith('xai-') || trimmed.startsWith('glpat-');
      case 'moonshot':
        return trimmed.startsWith('sk-');
      case 'ollama':
        // Ollama is local, just check if URL-like or 'local'
        return trimmed.length > 0 && (trimmed.includes('://') || trimmed === 'local');
      case 'lmstudio':
        // LM Studio is local, check if URL-like
        return trimmed.length > 0 && trimmed.includes('://');
      default:
        return trimmed.length >= 10;
    }
  }, []);

  const panelContent = (
    <>
      {/* Header - only show close button in modal mode */}
      {!embedded && (
        <div className="settings-header">
          <div className="settings-header-title">
            <SettingsIcon size={20} />
            <span>Settings</span>
          </div>
          <button className="settings-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      )}

        {/* Tabs */}
        <div className="settings-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          {isLoading && <div className="settings-loading">Loading...</div>}

          {!isLoading && activeTab === 'general' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Appearance</h3>

              <SettingSelect
                label="Theme"
                description="Choose your color theme"
                value={currentSettings.general.theme}
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                  { value: 'system', label: 'System' },
                ]}
                onChange={(value) => setSetting('general.theme', value)}
              />

              <SettingInput
                label="Font Size"
                description="Editor font size in pixels"
                value={currentSettings.general.fontSize}
                type="number"
                min={10}
                max={24}
                onChange={(value) => setSetting('general.fontSize', parseInt(value))}
              />

              <SettingToggle
                label="Show Sidebar"
                description="Show the file explorer sidebar by default"
                checked={currentSettings.general.sidebarVisible}
                onChange={(checked) => setSetting('general.sidebarVisible', checked)}
              />

              <SettingToggle
                label="Show Chat Panel"
                description="Show the AI chat panel by default"
                checked={currentSettings.general.chatVisible}
                onChange={(checked) => setSetting('general.chatVisible', checked)}
              />
            </div>
          )}

          {!isLoading && activeTab === 'editor' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Editor Behavior</h3>

              <SettingSelect
                label="Tab Size"
                description="Number of spaces per tab"
                value={String(currentSettings.editor.tabSize)}
                options={[
                  { value: '2', label: '2 spaces' },
                  { value: '4', label: '4 spaces' },
                ]}
                onChange={(value) => setSetting('editor.tabSize', parseInt(value))}
              />

              <SettingSelect
                label="Word Wrap"
                description="How to wrap long lines"
                value={currentSettings.editor.wordWrap}
                options={[
                  { value: 'on', label: 'On' },
                  { value: 'off', label: 'Off' },
                  { value: 'wordWrapColumn', label: 'At column' },
                ]}
                onChange={(value) => setSetting('editor.wordWrap', value)}
              />

              <SettingToggle
                label="Show Minimap"
                description="Show the code overview minimap"
                checked={currentSettings.editor.minimap}
                onChange={(checked) => setSetting('editor.minimap', checked)}
              />

              <SettingToggle
                label="Line Numbers"
                description="Show line numbers in the editor"
                checked={currentSettings.editor.lineNumbers === 'on'}
                onChange={(checked) => setSetting('editor.lineNumbers', checked ? 'on' : 'off')}
              />

              <SettingToggle
                label="Format on Save"
                description="Automatically format code when saving"
                checked={currentSettings.editor.formatOnSave}
                onChange={(checked) => setSetting('editor.formatOnSave', checked)}
              />

              <SettingSelect
                label="Auto Save"
                description="When to automatically save files"
                value={currentSettings.editor.autoSave}
                options={[
                  { value: 'off', label: 'Off' },
                  { value: 'afterDelay', label: 'After delay' },
                  { value: 'onFocusChange', label: 'On focus change' },
                ]}
                onChange={(value) => setSetting('editor.autoSave', value)}
              />
            </div>
          )}

          {!isLoading && activeTab === 'ai' && (
            <div className="settings-section">
              <h3 className="settings-section-title">AI Preferences</h3>

              <div className="setting-model-selector">
                <label className="setting-label">
                  <span className="setting-title">Default Model</span>
                  <span className="setting-description">Select your preferred AI model</span>
                </label>
                <div className="model-list">
                  {availableProviders.map((provider) => (
                    <div key={provider.name} className="model-provider-group">
                      <div className="model-provider-header">
                        <Cpu size={14} />
                        <span>{provider.name}</span>
                        {!provider.available && (
                          <span className="model-unavailable-badge">Configure API Key</span>
                        )}
                      </div>
                      {availableModels
                        .filter((m) => m.provider === provider.name)
                        .map((model) => (
                          <button
                            key={model.id}
                            className={`model-list-item ${
                              model.id === currentSettings.ai.defaultModel ? 'active' : ''
                            } ${!model.available ? 'disabled' : ''}`}
                            onClick={() => {
                              if (model.available) {
                                setSetting('ai.defaultModel', model.id);
                                setSetting('ai.defaultProvider', provider.name);
                                setModel(model.id, provider.name);
                              }
                            }}
                            disabled={!model.available}
                          >
                            <span className="model-name">{model.name}</span>
                            {model.id === currentSettings.ai.defaultModel && (
                              <Check size={14} className="model-check" />
                            )}
                          </button>
                        ))}
                    </div>
                  ))}
                </div>
              </div>

              <SettingInput
                label="Temperature"
                description="Randomness in AI responses (0-1)"
                value={currentSettings.ai.temperature}
                type="number"
                min={0}
                max={1}
                step={0.1}
                onChange={(value) => setSetting('ai.temperature', parseFloat(value))}
              />

              <SettingSelect
                label="Tool Permissions"
                description="Controls whether the agent can install packages, run commands, and edit files automatically"
                value={currentSettings.ai.autoRunMode}
                options={[
                  { value: 'always', label: 'Automatic — run tools without asking' },
                  { value: 'ask', label: 'Ask before running each tool' },
                  { value: 'never', label: 'Deny all tool execution' },
                ]}
                onChange={(value) => {
                  setSetting('ai.autoRunMode', value);
                  window.electronAPI?.agent?.setPermissionMode(value);
                }}
              />

              <SettingToggle
                label="Show Token Costs"
                description="Display API costs in the status bar"
                checked={currentSettings.ai.showTokenCosts}
                onChange={(checked) => setSetting('ai.showTokenCosts', checked)}
              />

              <SettingToggle
                label="Show Thinking"
                description="Show AI reasoning process"
                checked={currentSettings.ai.showThinking}
                onChange={(checked) => setSetting('ai.showThinking', checked)}
              />

              <h3 className="settings-section-title" style={{ marginTop: '24px' }}>Context Management</h3>

              <SettingInput
                label="Context Compression Threshold"
                description="Compress conversation when context exceeds this percentage of max (0.5-0.95)"
                value={currentSettings.ai.contextCompressionThreshold}
                type="number"
                min={0.5}
                max={0.95}
                step={0.05}
                onChange={(value) => setSetting('ai.contextCompressionThreshold', parseFloat(value))}
              />

              <SettingInput
                label="Recent Messages to Keep"
                description="Number of recent messages to preserve during compression (3-20)"
                value={currentSettings.ai.contextRecentMessagesToKeep}
                type="number"
                min={3}
                max={20}
                step={1}
                onChange={(value) => setSetting('ai.contextRecentMessagesToKeep', parseInt(value))}
              />

              <SettingToggle
                label="Limit Agent Turns"
                description="Enable to set a maximum number of LLM calls per task. Disable for unlimited turns."
                checked={currentSettings.ai.maxTurns !== null}
                onChange={(checked) => setSetting('ai.maxTurns', checked ? 50 : null)}
              />

              <SettingInput
                label="Max Agent Turns"
                description="Maximum LLM calls per task before stopping — increase for complex multi-step workflows (10-500)"
                value={currentSettings.ai.maxTurns ?? 50}
                type="number"
                min={10}
                max={500}
                step={5}
                disabled={currentSettings.ai.maxTurns === null}
                onChange={(value) => setSetting('ai.maxTurns', parseInt(value))}
              />

              <h3 className="settings-section-title" style={{ marginTop: '24px' }}>Chat Persistence</h3>

              <SettingToggle
                label="Auto-save Chats"
                description="Automatically save conversation history to workspace"
                checked={currentSettings.chat?.autoSave ?? true}
                onChange={(checked) => setSetting('chat.autoSave', checked)}
              />

              <SettingInput
                label="Auto-save Interval"
                description="Milliseconds between auto-saves (1000-30000)"
                value={currentSettings.chat?.autoSaveIntervalMs ?? 3000}
                type="number"
                min={1000}
                max={30000}
                step={500}
                disabled={!(currentSettings.chat?.autoSave ?? true)}
                onChange={(value) => setSetting('chat.autoSaveIntervalMs', parseInt(value))}
              />

              <SettingInput
                label="Max Saved Chats per Workspace"
                description="Maximum number of conversations to keep per workspace (10-100)"
                value={currentSettings.chat?.maxSavedChatsPerWorkspace ?? 50}
                type="number"
                min={10}
                max={100}
                step={5}
                onChange={(value) => setSetting('chat.maxSavedChatsPerWorkspace', parseInt(value))}
              />
            </div>
          )}

          {!isLoading && activeTab === 'apiKeys' && (
            <div className="settings-section">
              <h3 className="settings-section-title">API Keys</h3>
              <p className="settings-section-description">
                Configure API keys for AI providers. Keys are stored locally and never shared.
                <br />
                <span className="validation-hint">
                  <CheckCircle2 size={12} className="valid-icon" /> = Valid key format detected
                </span>
              </p>

              <div className="api-key-row">
                <SettingInput
                  label="Anthropic API Key"
                  description="For Claude models (claude-sonnet, claude-opus, etc.)"
                  value={currentSettings.apiKeys?.anthropic || ''}
                  type="password"
                  onChange={(value) => setSetting('apiKeys.anthropic', value)}
                />
                {validateApiKey('anthropic', currentSettings.apiKeys?.anthropic || '') && (
                  <div className="validation-badge valid">
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </div>

              <div className="api-key-row">
                <SettingInput
                  label="OpenAI API Key"
                  description="For GPT-4, GPT-3.5, GPT-4o models"
                  value={currentSettings.apiKeys?.openai || ''}
                  type="password"
                  onChange={(value) => setSetting('apiKeys.openai', value)}
                />
                {validateApiKey('openai', currentSettings.apiKeys?.openai || '') && (
                  <div className="validation-badge valid">
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </div>

              <div className="api-key-row">
                <SettingInput
                  label="xAI API Key"
                  description="For Grok models (grok-2, grok-2-vision, etc.)"
                  value={currentSettings.apiKeys?.xai || ''}
                  type="password"
                  onChange={(value) => setSetting('apiKeys.xai', value)}
                />
                {validateApiKey('xai', currentSettings.apiKeys?.xai || '') && (
                  <div className="validation-badge valid">
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </div>

              <div className="api-key-row">
                <SettingInput
                  label="Moonshot API Key"
                  description="For Kimi models (kimi-k2.5, kimi-k1.6, etc.)"
                  value={currentSettings.apiKeys?.moonshot || ''}
                  type="password"
                  onChange={(value) => setSetting('apiKeys.moonshot', value)}
                />
                {validateApiKey('moonshot', currentSettings.apiKeys?.moonshot || '') && (
                  <div className="validation-badge valid">
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </div>

              <div className="api-key-row">
                <SettingInput
                  label="Google AI API Key"
                  description="For Gemini models"
                  value={currentSettings.apiKeys?.google || ''}
                  type="password"
                  onChange={(value) => setSetting('apiKeys.google', value)}
                />
                {validateApiKey('google', currentSettings.apiKeys?.google || '') && (
                  <div className="validation-badge valid">
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </div>

              <div className="api-key-row">
                <SettingInput
                  label="Groq API Key"
                  description="For fast LLM inference"
                  value={currentSettings.apiKeys?.groq || ''}
                  type="password"
                  onChange={(value) => setSetting('apiKeys.groq', value)}
                />
                {validateApiKey('groq', currentSettings.apiKeys?.groq || '') && (
                  <div className="validation-badge valid">
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </div>

              <div className="api-key-row">
                <SettingInput
                  label="Together AI API Key"
                  description="For open-source models"
                  value={currentSettings.apiKeys?.together || ''}
                  type="password"
                  onChange={(value) => setSetting('apiKeys.together', value)}
                />
                {validateApiKey('together', currentSettings.apiKeys?.together || '') && (
                  <div className="validation-badge valid">
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </div>

              <div className="api-key-row">
                <SettingInput
                  label="Ollama Host"
                  description="URL for Ollama (default: http://localhost:11434)"
                  value={currentSettings.apiKeys?.ollama || ''}
                  onChange={(value) => setSetting('apiKeys.ollama', value)}
                />
                {validateApiKey('ollama', currentSettings.apiKeys?.ollama || '') && (
                  <div className="validation-badge valid">
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </div>

              <div className="api-key-row">
                <SettingInput
                  label="LM Studio Host"
                  description="URL for LM Studio (default: http://localhost:1234)"
                  value={currentSettings.apiKeys?.lmstudio || ''}
                  onChange={(value) => setSetting('apiKeys.lmstudio', value)}
                />
                {validateApiKey('lmstudio', currentSettings.apiKeys?.lmstudio || '') && (
                  <div className="validation-badge valid">
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'shortcuts' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Keyboard Shortcuts</h3>
              <p className="settings-section-description">
                Keyboard shortcuts can be customized here. Format: CmdOrCtrl+Key or Ctrl+Shift+Key
              </p>

              <SettingInput
                label="Open Chat"
                value={currentSettings.shortcuts.openChat}
                onChange={(value) => setSetting('shortcuts.openChat', value)}
              />

              <SettingInput
                label="Toggle Sidebar"
                value={currentSettings.shortcuts.toggleSidebar}
                onChange={(value) => setSetting('shortcuts.toggleSidebar', value)}
              />

              <SettingInput
                label="Send Message"
                value={currentSettings.shortcuts.sendMessage}
                onChange={(value) => setSetting('shortcuts.sendMessage', value)}
              />

              <SettingInput
                label="Abort Agent"
                value={currentSettings.shortcuts.abortAgent}
                onChange={(value) => setSetting('shortcuts.abortAgent', value)}
              />

              <SettingInput
                label="Open Settings"
                value={currentSettings.shortcuts.openSettings}
                onChange={(value) => setSetting('shortcuts.openSettings', value)}
              />

              <div className="settings-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleReset('shortcuts')}
                >
                  Reset Shortcuts
                </button>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'files' && (
            <div className="settings-section">
              <h3 className="settings-section-title">File Preferences</h3>

              <SettingInput
                label="Exclude Patterns"
                description="Comma-separated glob patterns to exclude from file explorer"
                value={currentSettings.files.excludePatterns.join(', ')}
                onChange={(value) =>
                  setSetting(
                    'files.excludePatterns',
                    value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
              />

              <SettingToggle
                label="Follow Symlinks"
                description="Follow symbolic links when searching files"
                checked={currentSettings.files.followSymlinks}
                onChange={(checked) => setSetting('files.followSymlinks', checked)}
              />
            </div>
          )}

          {!isLoading && activeTab === 'indexing' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Codebase Indexing</h3>
              <p className="settings-section-description">
                Semantic indexing enables natural language search of your codebase.
                The index is stored locally and never sent to external servers.
              </p>

              <SettingToggle
                label="Auto-index on project open"
                description="Automatically start indexing when a project is opened"
                checked={currentSettings.indexing.autoIndex}
                onChange={(checked) => setSetting('indexing.autoIndex', checked)}
              />

              <SettingToggle
                label="Auto-sync"
                description="Automatically sync the index when files change"
                checked={currentSettings.indexing.autoSync}
                onChange={(checked) => setSetting('indexing.autoSync', checked)}
              />

              <SettingSelect
                label="Sync Interval"
                description="How often to check for file changes and update the index"
                value={String(currentSettings.indexing.syncIntervalMinutes)}
                options={[
                  { value: '1', label: '1 minute' },
                  { value: '5', label: '5 minutes' },
                  { value: '10', label: '10 minutes' },
                  { value: '30', label: '30 minutes' },
                ]}
                onChange={(value) => setSetting('indexing.syncIntervalMinutes', parseInt(value))}
              />

              <SettingToggle
                label="Semantic Chunking"
                description="Use language-aware chunking for better search results (functions, classes)"
                checked={currentSettings.indexing.useSemanticChunking}
                onChange={(checked) => setSetting('indexing.useSemanticChunking', checked)}
              />

              <SettingInput
                label="Max Files to Index"
                description="Maximum number of files to include in the index"
                value={String(currentSettings.indexing.maxFilesToIndex)}
                type="number"
                min={100}
                max={5000}
                onChange={(value) => setSetting('indexing.maxFilesToIndex', parseInt(value) || 500)}
              />

              <SettingInput
                label="Max File Size (MB)"
                description="Skip files larger than this size"
                value={String(currentSettings.indexing.maxFileSizeMB)}
                type="number"
                min={1}
                max={50}
                onChange={(value) => setSetting('indexing.maxFileSizeMB', parseInt(value) || 1)}
              />

              <SettingInput
                label="Indexing Exclude Patterns"
                description="Comma-separated glob patterns to exclude from indexing"
                value={currentSettings.indexing.excludePatterns.join(', ')}
                onChange={(value) =>
                  setSetting(
                    'indexing.excludePatterns',
                    value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
              />

              <div className="settings-info-box">
                <strong>Tips for better indexing:</strong>
                <ul>
                  <li>Create a <code>.omniignore</code> file in your project root for project-specific exclusions</li>
                  <li>Exclude large generated files (build outputs, lock files)</li>
                  <li>Semantic chunking provides better results but uses more storage</li>
                  <li>Indexing happens in the background and won&apos;t slow down your work</li>
                </ul>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'privacy' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Privacy</h3>

              <SettingToggle
                label="Telemetry"
                description="Send anonymous usage data to help improve the app"
                checked={currentSettings.privacy.telemetryEnabled}
                onChange={(checked) => setSetting('privacy.telemetryEnabled', checked)}
              />

              <SettingToggle
                label="Crash Reports"
                description="Automatically send crash reports"
                checked={currentSettings.privacy.crashReportsEnabled}
                onChange={(checked) => setSetting('privacy.crashReportsEnabled', checked)}
              />

              <div className="settings-actions">
                <button
                  className="btn btn-danger"
                  onClick={() => handleReset()}
                >
                  Reset All Settings
                </button>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'usage' && (
            <div className="settings-section">
              <UsageDashboard />
            </div>
          )}

          {!isLoading && activeTab === 'remote' && (
            <div className="settings-section">
              <h3 className="settings-section-title">
                <Globe size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Remote Access
              </h3>
              <p className="settings-section-description">
                Enable remote access to control omni-code from your mobile device anywhere.
                Requires an ngrok account (free tier works).
              </p>

              <SettingToggle
                label="Enable Remote Access"
                description="Start remote server automatically when omni-code launches"
                checked={currentSettings.remoteAccess?.enabled || false}
                onChange={(checked) => setSetting('remoteAccess.enabled', checked)}
              />

              <div className="api-key-row">
                <SettingInput
                  label="ngrok Auth Token"
                  description="Your ngrok authentication token (get one at ngrok.com)"
                  value={currentSettings.remoteAccess?.ngrokAuthToken || ''}
                  type="password"
                  onChange={(value) => setSetting('remoteAccess.ngrokAuthToken', value)}
                />
              </div>

              <SettingInput
                label="Server Port"
                description="Local port for the HTTP server (default: 3000)"
                value={currentSettings.remoteAccess?.port || 3000}
                type="number"
                min={1000}
                max={65535}
                onChange={(value) => setSetting('remoteAccess.port', parseInt(value))}
              />

              <h3 className="settings-section-title" style={{ marginTop: '24px' }}>Server Status</h3>

              <div className="remote-status-box">
                <div className="remote-status-item">
                  <span className="remote-status-label">Status:</span>
                  <span className={`remote-status-value ${remoteStatus?.running ? 'running' : 'stopped'}`}>
                    {remoteStatus?.running ? 'Running' : 'Stopped'}
                  </span>
                </div>

                {remoteStatus?.running && remoteStatus?.url && (
                  <div className="remote-status-item">
                    <span className="remote-status-label">Public URL:</span>
                    <div className="remote-url-box">
                      <code>{remoteStatus.url}</code>
                      <button
                        className="remote-copy-btn"
                        onClick={() => copyToClipboard(remoteStatus.url!)}
                        title="Copy URL"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {remoteStatus?.apiKey && (
                  <div className="remote-status-item">
                    <span className="remote-status-label">API Key:</span>
                    <div className="remote-apikey-box">
                      <code>{remoteStatus.apiKey.slice(0, 8)}...{remoteStatus.apiKey.slice(-8)}</code>
                      <button
                        className="remote-copy-btn"
                        onClick={() => copyToClipboard(remoteStatus.apiKey!)}
                        title="Copy API Key"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {remoteStatus?.running && (
                  <div className="remote-status-item">
                    <span className="remote-status-label">Active Connections:</span>
                    <span className="remote-status-value">
                      {remoteStatus?.connections?.totalConnections || 0} connections
                      {' '}
                      ({remoteStatus?.connections?.totalConversations || 0} conversations)
                    </span>
                  </div>
                )}
              </div>

              <div className="remote-actions">
                {!remoteStatus?.running ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleRemoteStart}
                    disabled={remoteLoading || !currentSettings.remoteAccess?.ngrokAuthToken}
                  >
                    <Play size={16} style={{ marginRight: '8px' }} />
                    {remoteLoading ? 'Starting...' : 'Start Server'}
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={handleRemoteStop}
                    disabled={remoteLoading}
                  >
                    <Square size={16} style={{ marginRight: '8px' }} />
                    {remoteLoading ? 'Stopping...' : 'Stop Server'}
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  onClick={handleRegenerateApiKey}
                  disabled={remoteLoading}
                >
                  <RefreshCw size={16} style={{ marginRight: '8px' }} />
                  Regenerate API Key
                </button>
              </div>

              {/* QR Code Section - Only show when server is running */}
              {remoteStatus?.running && (
                <div className="qr-code-section" style={{ marginTop: '24px' }}>
                  <h3 className="settings-section-title">Quick Connect via QR Code</h3>
                  <p className="settings-section-description">
                    Scan this QR code with your mobile app to connect instantly.
                    <strong> Keep this private - anyone with access can connect to your server.</strong>
                  </p>

                  {!qrCodeDataUrl ? (
                    <button
                      className="btn btn-primary"
                      onClick={handleGenerateQR}
                      disabled={qrLoading || !remoteStatus?.running}
                    >
                      {qrLoading ? 'Generating...' : 'Show QR Code'}
                    </button>
                  ) : (
                    <div className="qr-code-display">
                      <div
                        className="qr-code-container"
                        style={{
                          background: 'white',
                          padding: '16px',
                          borderRadius: '12px',
                          display: 'inline-block',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        <img
                          src={qrCodeDataUrl}
                          alt="Connection QR Code"
                          style={{
                            width: '250px',
                            height: '250px',
                            display: 'block',
                          }}
                        />
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setQrCodeDataUrl(null)}
                          style={{ fontSize: '14px' }}
                        >
                          Hide QR Code
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="settings-info-box" style={{ marginTop: '24px' }}>
                <strong>Mobile App Setup:</strong>
                <ol>
                  <li>Copy the Public URL and API Key above</li>
                  <li>In your mobile app, create a connection using these credentials</li>
                  <li>All communication is encrypted via ngrok's HTTPS tunnel</li>
                  <li>Rate limiting is active (100 requests per 15 minutes by default)</li>
                </ol>
              </div>

              <div className="settings-actions" style={{ marginTop: '24px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleReset('remoteAccess')}
                >
                  Reset Remote Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </>
  );

  if (embedded) {
    return (
      <div className="settings-embedded">
        {panelContent}
      </div>
    );
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        {panelContent}
      </div>
    </div>
  );
};
