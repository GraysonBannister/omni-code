import React, { useState, useCallback } from 'react';
import { Box } from 'ink';
import { REPL } from './REPL.js';
import type { Agent } from '../../core/agent-types.js';
import type { AutoOrchestrator } from '../../core/orchestration/index.js';

interface AppProps {
  agent: Agent;
  model: string;
  provider: string;
  onSlashCommand?: (command: string) => Promise<string | void>;
  orchestrator?: AutoOrchestrator;
  onUIStateUpdaterReady?: (updater: (updates: { model?: string; provider?: string; systemPrompt?: string; planMode?: boolean }) => void) => void;
}

export const App: React.FC<AppProps> = ({ agent, model: initialModel, provider: initialProvider, onSlashCommand, orchestrator, onUIStateUpdaterReady }) => {
  // Use state for model and provider so they can trigger re-renders
  const [model, setModel] = useState(initialModel);
  const [provider, setProvider] = useState(initialProvider);

  // Create the UI state updater function
  const updateUIState = useCallback((updates: { model?: string; provider?: string; systemPrompt?: string; planMode?: boolean }) => {
    if (updates.model) {
      setModel(updates.model);
    }
    if (updates.provider) {
      setProvider(updates.provider);
    }
  }, []);

  // Pass the updater to the parent so commands can use it
  React.useEffect(() => {
    if (onUIStateUpdaterReady) {
      onUIStateUpdaterReady(updateUIState);
    }
  }, [onUIStateUpdaterReady, updateUIState]);

  return (
    <Box flexDirection="column">
      <REPL
        agent={agent}
        model={model}
        provider={provider}
        onSlashCommand={onSlashCommand}
        orchestrator={orchestrator}
      />
    </Box>
  );
};
