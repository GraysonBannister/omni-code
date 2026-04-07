import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { shell } from 'electron';

const OMNICODE_DIR = '.omnicode';
const PLAN_FILE_NAME = 'plan.json';

export interface PlanFileStep {
  id: string;
  title: string;
  description: string;
  files?: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: string | null;
  completedAt: string | null;
}

export interface PlanFileData {
  version: number;
  id: string;
  conversationId: string;
  title: string;
  goal: string;
  createdAt: string;
  approvedAt: string | null;
  completedAt: string | null;
  files: Array<{ path: string; action: 'create' | 'modify' | 'delete'; reason: string }>;
  steps: PlanFileStep[];
  risks: string[];
  questions: string[];
}

// Active watchers keyed by absolute plan file path
const activeWatchers = new Map<string, fsSync.FSWatcher>();
// Per-file debounce timers
const debounceTimers = new Map<string, NodeJS.Timeout>();

export function getPlanFilePath(workspaceRoot: string): string {
  return path.join(workspaceRoot, OMNICODE_DIR, PLAN_FILE_NAME);
}

export async function createPlanFile(
  workspaceRoot: string,
  plan: {
    title: string;
    goal: string;
    files?: Array<{ path: string; action: string; reason: string }>;
    steps: Array<{ id: string; title: string; description: string; files?: string[] }>;
    risks?: string[];
    questions?: string[];
  },
  conversationId: string,
): Promise<string> {
  const omnicodeDir = path.join(workspaceRoot, OMNICODE_DIR);
  await fs.mkdir(omnicodeDir, { recursive: true });

  const filePath = getPlanFilePath(workspaceRoot);

  const data: PlanFileData = {
    version: 1,
    id: randomUUID(),
    conversationId,
    title: plan.title,
    goal: plan.goal,
    createdAt: new Date().toISOString(),
    approvedAt: null,
    completedAt: null,
    files: (plan.files ?? []) as PlanFileData['files'],
    steps: plan.steps.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      files: s.files,
      status: 'pending',
      startedAt: null,
      completedAt: null,
    })),
    risks: plan.risks ?? [],
    questions: plan.questions ?? [],
  };

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

export async function readPlanFile(filePath: string): Promise<PlanFileData | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as PlanFileData;
  } catch {
    return null;
  }
}

export async function updatePlanStep(
  filePath: string,
  stepId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
): Promise<void> {
  const data = await readPlanFile(filePath);
  if (!data) return;

  const step = data.steps.find(s => s.id === stepId);
  if (!step) return;

  step.status = status;
  if (status === 'in_progress' && !step.startedAt) {
    step.startedAt = new Date().toISOString();
  }
  if (status === 'completed' || status === 'failed') {
    step.completedAt = new Date().toISOString();
  }

  if (data.steps.every(s => s.status === 'completed' || s.status === 'failed')) {
    data.completedAt = new Date().toISOString();
  }

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function markPlanApproved(filePath: string): Promise<void> {
  const data = await readPlanFile(filePath);
  if (!data) return;

  data.approvedAt = new Date().toISOString();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function openPlanFile(filePath: string): Promise<void> {
  await shell.openPath(filePath);
}

export function watchPlanFile(
  filePath: string,
  conversationId: string,
  onChange: (conversationId: string, data: PlanFileData) => void,
): void {
  stopWatchingPlanFile(filePath);

  try {
    const watcher = fsSync.watch(filePath, eventType => {
      if (eventType !== 'change') return;

      const existing = debounceTimers.get(filePath);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(async () => {
        debounceTimers.delete(filePath);
        const data = await readPlanFile(filePath);
        if (data) {
          onChange(conversationId, data);
        }
      }, 300);

      debounceTimers.set(filePath, timer);
    });

    activeWatchers.set(filePath, watcher);
  } catch (error) {
    console.error('[PlanFileManager] Failed to watch plan file:', error);
  }
}

export function stopWatchingPlanFile(filePath: string): void {
  const timer = debounceTimers.get(filePath);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(filePath);
  }

  const watcher = activeWatchers.get(filePath);
  if (watcher) {
    watcher.close();
    activeWatchers.delete(filePath);
  }
}

export function stopAllPlanWatchers(): void {
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer);
  }
  debounceTimers.clear();

  for (const watcher of activeWatchers.values()) {
    watcher.close();
  }
  activeWatchers.clear();
}
