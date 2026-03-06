import { FileWatcher, type FileChangeEvent } from './file-watcher.js';
import { EventBus } from '../utils/event-bus.js';

export interface AutomationRule {
  name: string;
  trigger: {
    type: 'file_change';
    patterns: string[];
  };
  action: {
    type: 'run_command' | 'lint' | 'typecheck' | 'test' | 'notify';
    command?: string;
    args?: string[];
  };
  enabled: boolean;
  debounceMs?: number;
}

export interface AutomationConfig {
  enabled: boolean;
  rules: AutomationRule[];
}

export class AutomationManager {
  private watcher: FileWatcher | null = null;
  private rules: AutomationRule[] = [];
  private eventBus: EventBus;
  private cwd: string;
  private running = false;

  constructor(eventBus: EventBus, cwd: string) {
    this.eventBus = eventBus;
    this.cwd = cwd;
  }

  configure(config: AutomationConfig): void {
    this.rules = config.rules.filter(r => r.enabled);
  }

  start(): void {
    if (this.running || this.rules.length === 0) return;
    this.running = true;

    // Collect all unique patterns
    const patterns = new Set<string>();
    for (const rule of this.rules) {
      if (rule.trigger.type === 'file_change') {
        for (const p of rule.trigger.patterns) {
          patterns.add(p);
        }
      }
    }

    this.watcher = new FileWatcher({
      patterns: Array.from(patterns),
      debounceMs: 500,
    });

    this.watcher.on('change', (event: FileChangeEvent) => {
      this.handleFileChange(event);
    });

    this.watcher.on('error', (error: Error) => {
      this.eventBus.emit('automation_error', { error: error.message });
    });

    this.watcher.start(this.cwd, Array.from(patterns));
  }

  stop(): void {
    this.running = false;
    this.watcher?.stop();
    this.watcher = null;
  }

  getRules(): AutomationRule[] {
    return [...this.rules];
  }

  private handleFileChange(event: FileChangeEvent): void {
    for (const rule of this.rules) {
      if (rule.trigger.type !== 'file_change') continue;

      // Check if file matches rule patterns
      const matches = rule.trigger.patterns.some(p => {
        if (p.startsWith('*.')) return event.path.endsWith(p.substring(1));
        return event.path.includes(p);
      });

      if (!matches) continue;

      this.eventBus.emit('automation_triggered', {
        rule: rule.name,
        trigger: event,
        action: rule.action,
      });

      // Execute action
      this.executeAction(rule);
    }
  }

  private executeAction(rule: AutomationRule): void {
    switch (rule.action.type) {
      case 'run_command':
        if (rule.action.command) {
          this.eventBus.emit('automation_run', {
            rule: rule.name,
            command: rule.action.command,
          });
        }
        break;

      case 'lint':
        this.eventBus.emit('automation_run', {
          rule: rule.name,
          command: 'npx eslint --fix',
        });
        break;

      case 'typecheck':
        this.eventBus.emit('automation_run', {
          rule: rule.name,
          command: 'npx tsc --noEmit',
        });
        break;

      case 'test':
        this.eventBus.emit('automation_run', {
          rule: rule.name,
          command: 'npm test',
        });
        break;

      case 'notify':
        this.eventBus.emit('automation_notify', {
          rule: rule.name,
          message: `Automation "${rule.name}" triggered`,
        });
        break;
    }
  }
}
