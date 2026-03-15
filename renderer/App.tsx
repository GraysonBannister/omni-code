import React, { useEffect, useCallback, useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/Editor';
import { ChatPanel } from './components/ChatPanel';
import { StatusBar } from './components/StatusBar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { HeaderBar } from './components/HeaderBar';
import { TerminalPanel } from './components/TerminalPanel';
import { WorkspaceManager } from './components/WorkspaceManager';
import { useAppStore, subscribeToBrowserEvents } from './stores/appStore';
import { useSettingsStore } from './stores/settingsStore';
import './styles/app.css';

export const App: React.FC = () => {
  const {
    sidebarVisible,
    chatVisible,
    terminalVisible,
    projectPath,
    currentWorkspace,
    isWorkspaceMode,
    recentFolders,
    recentWorkspaces: recentWorkspaceFiles,
    openFolder,
    createFolder,
    openRecentWorkspace,
    openWorkspace,
    loadSavedWorkspaces,
  } = useAppStore();
  const [isElectron, setIsElectron] = React.useState(true);
  const [recentFoldersState, setRecentFoldersState] = useState<string[]>([]);
  const [recentWorkspacesState, setRecentWorkspacesState] = useState<string[]>([]);
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [workspaceManagerOpen, setWorkspaceManagerOpen] = useState(false);
  const openSettings = useAppStore(state => state.openSettings);

  // Handler for opening workspace file dialog
  const openWorkspaceDialog = useCallback(async () => {
    try {
      const result = await window.electronAPI?.dialog?.openWorkspace();
      if (result && !result.canceled && result.path) {
        await openWorkspace(result.path);
      }
    } catch (error) {
      console.error('Failed to open workspace dialog:', error);
    }
  }, [openWorkspace]);


  // Check if we're running in Electron
  // IMPORTANT: Empty dependency array - use getState() inside for store access
  // to prevent infinite re-renders when AI streams content
  useEffect(() => {
    if (!window.electronAPI) {
      console.warn('Not running in Electron - electronAPI not available');
      setIsElectron(false);
      return;
    }

    // Setup keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMetaOrCtrl = e.metaKey || e.ctrlKey;
      const appState = useAppStore.getState();
      const { conversations, activeConversationId, createConversation, closeConversation, setActiveConversation } = appState;
      
      // Cmd/Ctrl + , for settings
      if (isMetaOrCtrl && e.key === ',') {
        e.preventDefault();
        openSettings();
      }

      // Cmd/Ctrl + ` for terminal
      if (isMetaOrCtrl && e.key === '`') {
        e.preventDefault();
        useAppStore.getState().toggleTerminal();
      }

      // Cmd/Ctrl + Shift + T for new terminal
      if (isMetaOrCtrl && e.shiftKey && (e.key === 'T' || e.key === 't')) {
        e.preventDefault();
        const { createTerminal, projectPath } = useAppStore.getState();
        createTerminal(projectPath);
      }
      
      // Cmd/Ctrl + T for new conversation
      if (isMetaOrCtrl && e.key === 't' && !e.shiftKey) {
        e.preventDefault();
        createConversation();
      }
      
      // Cmd/Ctrl + W for close active conversation
      if (isMetaOrCtrl && e.key === 'w' && !e.shiftKey) {
        e.preventDefault();
        if (activeConversationId) {
          const activeConv = conversations.find(c => c.id === activeConversationId);
          if (activeConv) {
            const hasMessages = activeConv.messages.length > 0;
            if (hasMessages) {
              const confirmed = window.confirm('Close this conversation? All messages will be lost.');
              if (!confirmed) return;
            }
            closeConversation(activeConversationId);
          }
        }
      }
      
      // Cmd/Ctrl + Shift + [ for previous conversation
      if (isMetaOrCtrl && e.shiftKey && (e.key === '{' || e.key === '[')) {
        e.preventDefault();
        if (conversations.length > 1 && activeConversationId) {
          const currentIndex = conversations.findIndex(c => c.id === activeConversationId);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : conversations.length - 1;
          setActiveConversation(conversations[prevIndex].id);
        }
      }
      
      // Cmd/Ctrl + Shift + ] for next conversation
      if (isMetaOrCtrl && e.shiftKey && (e.key === '}' || e.key === ']')) {
        e.preventDefault();
        if (conversations.length > 1 && activeConversationId) {
          const currentIndex = conversations.findIndex(c => c.id === activeConversationId);
          const nextIndex = currentIndex < conversations.length - 1 ? currentIndex + 1 : 0;
          setActiveConversation(conversations[nextIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const init = async () => {
      console.log('[App] Starting initialization...');
      setIsInitializing(true);
      setInitError(null);
      
      try {
        // Get store functions via getState() to avoid dependency issues
        const { setAvailableModels, setAvailableProviders, setModel, setAppInitialized: storeSetAppInitialized } = useAppStore.getState();
        const { loadSettings, getRecentWorkspaces } = useSettingsStore.getState();

        // Load settings first
        console.log('[App] Loading settings...');
        await loadSettings();
        console.log('[App] Settings loaded successfully');

        // Load available models and providers
        console.log('[App] Loading models and providers...');
        const [models, providers] = await Promise.all([
          window.electronAPI!.config.getModels(),
          window.electronAPI!.config.getProviders(),
        ]);
        console.log('[App] Loaded models:', models.length, 'providers:', providers.length);

        setAvailableModels(models);
        setAvailableProviders(providers);

        // Note: We get settings from the store after loadSettings completes
        // Using the settingsStore directly to avoid dependency issues
        const currentSettings = useSettingsStore.getState().settings;
        const aiSettings = currentSettings?.ai;
        if (aiSettings?.defaultModel && aiSettings?.defaultProvider) {
          console.log('[App] Setting model from settings:', aiSettings.defaultModel);
          setModel(aiSettings.defaultModel, aiSettings.defaultProvider);
        } else {
          // Fallback to config
          console.log('[App] Loading model from config...');
          const currentModel = await window.electronAPI!.config.get('defaultModel');
          const currentProvider = await window.electronAPI!.config.get('defaultProvider');
          if (currentModel && currentProvider) {
            setModel(currentModel as string, currentProvider as string);
          }
        }

        // Load recent folders and workspaces for welcome screen
        console.log('[App] Loading recent folders and workspaces...');
        const [folders, workspaces] = await Promise.all([
          window.electronAPI!.settings.getRecentFolders(),
          window.electronAPI!.settings.getRecentWorkspaces(),
        ]);
        console.log('[App] Loaded recent folders:', folders.value?.length || 0);
        console.log('[App] Loaded recent workspaces:', workspaces.value?.length || 0);
        setRecentFoldersState(folders.value || []);
        setRecentWorkspacesState(workspaces.value || []);

        // Load saved workspace list
        await loadSavedWorkspaces();
        
        console.log('[App] Initialization complete');
        storeSetAppInitialized(true);
      } catch (error) {
        console.error('[App] Failed to initialize:', error);
        setInitError((error as Error).message);
        storeSetAppInitialized(true); // Still mark as initialized to allow usage
      } finally {
        setIsInitializing(false);
      }
    };

    init();

    // Setup menu action handlers
    const unsubscribeMenu = window.electronAPI!.app.onMenuAction((action) => {
      handleMenuAction(action);
    });

    // Setup open-recent handler from menu
    const unsubscribeOpenRecent = window.electronAPI!.app.onOpenRecent((path: string) => {
      const { openRecentWorkspace, openWorkspace } = useAppStore.getState();
      // Check if it's a workspace file
      if (path.endsWith('.omnicode-workspace')) {
        openWorkspace(path);
      } else {
        openRecentWorkspace(path);
      }
    });

    // Setup before quit handler
    const unsubscribeQuit = window.electronAPI!.app.onBeforeQuit(async () => {
      console.log('App quitting, saving state...');

      // Force save all dirty conversations before app quits
      const { saveAllConversations } = useAppStore.getState();
      try {
        await saveAllConversations();
        console.log('Saved all conversations before quit');
      } catch (error) {
        console.error('Failed to save conversations before quit:', error);
      } finally {
        // Signal the main process that saving is complete so it doesn't have
        // to wait for the 5-second timeout before quitting.
        window.electronAPI!.app.notifySaveComplete();
      }
    });

    // Subscribe to browser events from AI
    const unsubscribeBrowser = subscribeToBrowserEvents();

    return () => {
      unsubscribeMenu();
      unsubscribeOpenRecent();
      unsubscribeQuit();
      unsubscribeBrowser();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMenuAction = useCallback((action: string, ...args: any[]) => {
    if (!window.electronAPI) return;

    const state = useAppStore.getState();

    switch (action) {
      case 'new-file':
        // Trigger new file creation
        break;
      case 'open-folder':
        openFolder();
        break;
      case 'open-workspace':
        // Open workspace file dialog would go here
        break;
      case 'open-recent':
        // Open recent from menu - could be folder or workspace
        if (args.length > 0 && typeof args[0] === 'string') {
          const path = args[0];
          if (path.endsWith('.omnicode-workspace')) {
            openWorkspace(path);
          } else {
            openRecentWorkspace(path);
          }
        }
        break;
      case 'save':
        // Save current file
        break;
      case 'toggle-sidebar':
        state.toggleSidebar();
        break;
      case 'toggle-chat':
        state.toggleChat();
        break;
      case 'send-message':
        // Focus chat input and trigger send
        break;
      case 'abort':
        if (state.activeConversationId) {
          window.electronAPI.agent.abort(state.activeConversationId);
        }
        break;
      case 'clear-chat':
        state.clearMessages();
        break;
      case 'open-settings':
        openSettings();
        break;
      case 'close-workspace':
        if (state.isWorkspaceMode) {
          state.closeWorkspace();
        }
        break;
    }
  }, [openFolder, openRecentWorkspace, openWorkspace]);

  // Show error if not running in Electron
  if (!isElectron) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1>Omni Code</h1>
        <p style={{ color: '#ff6b6b', marginTop: '20px' }}>
          This application must be run within Electron.
        </p>
        <p style={{ color: '#888', marginTop: '10px' }}>
          Please run: <code>npm run electron:dev</code>
        </p>
        <p style={{ color: '#888', marginTop: '10px', fontSize: '12px' }}>
          Or open DevTools (F12) to see more details.
        </p>
      </div>
    );
  }

  // Show initialization error
  if (initError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center',
        background: '#1a1a1a',
        color: '#e0e0e0'
      }}>
        <h1>Omni Code</h1>
        <p style={{ color: '#ff6b6b', marginTop: '20px' }}>
          Failed to initialize: {initError}
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Show loading state
  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: '#e0e0e0'
      }}>
        <h1>Omni Code</h1>
        <p style={{ marginTop: '20px', color: '#888' }}>Loading...</p>
      </div>
    );
  }

  // Show welcome screen when no project or workspace is open
  if (!projectPath && !currentWorkspace) {
    return (
      <>
        <WelcomeScreen
          onOpenFolder={openFolder}
          onCreateFolder={createFolder}
          onOpenRecent={openRecentWorkspace}
          onOpenWorkspace={openWorkspaceDialog}
          onCreateWorkspace={() => setWorkspaceManagerOpen(true)}
          recentFolders={recentFoldersState}
          recentWorkspaces={recentWorkspacesState}
        />
        <WorkspaceManager
          isOpen={workspaceManagerOpen}
          onClose={() => setWorkspaceManagerOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="app">
      {/* Top Header Bar */}
      <HeaderBar />

      <div className="app-body">
        <PanelGroup direction="horizontal">
          {/* Sidebar - File Explorer */}
          {sidebarVisible && (
            <>
              <Panel
                id="sidebar"
                order={1}
                defaultSize={sidebarVisible && chatVisible ? 20 : 25}
                minSize={5}
                className="sidebar-panel"
              >
                <FileExplorer />
              </Panel>
              <PanelResizeHandle className="resizer resizer-horizontal" />
            </>
          )}

          {/* Editor Area */}
          <Panel
            id="editor"
            order={2}
            defaultSize={sidebarVisible && chatVisible ? 55 : (sidebarVisible || chatVisible ? 75 : 100)}
            minSize={10}
            className="editor-panel"
          >
            <CodeEditor />
            {terminalVisible && <TerminalPanel />}
          </Panel>

          {/* Chat Panel */}
          {chatVisible && (
            <>
              <PanelResizeHandle className="resizer resizer-horizontal" />
              <Panel
                id="chat"
                order={3}
                defaultSize={sidebarVisible && chatVisible ? 25 : 20}
                minSize={5}
                className="chat-panel"
              >
                <ChatPanel />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Workspace Manager Dialog */}
      <WorkspaceManager
        isOpen={workspaceManagerOpen}
        onClose={() => setWorkspaceManagerOpen(false)}
      />
    </div>
  );
};
