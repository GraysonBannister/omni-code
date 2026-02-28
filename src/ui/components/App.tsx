import React from 'react';
import { Box } from 'ink';
import { REPL } from './REPL.js';
import type { Agent } from '../../core/agent-types.js';

interface AppProps {
  agent: Agent;
  model: string;
  provider: string;
  onSlashCommand?: (command: string) => Promise<string | void>;
}

export const App: React.FC<AppProps> = ({ agent, model, provider, onSlashCommand }) => {
  return (
    <Box flexDirection="column">
      <REPL
        agent={agent}
        model={model}
        provider={provider}
        onSlashCommand={onSlashCommand}
      />
    </Box>
  );
};
