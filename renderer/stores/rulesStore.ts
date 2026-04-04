import { create } from 'zustand';

export interface RuleData {
  id: string;
  filePath: string;
  frontmatter: {
    description?: string;
    globs?: string | string[];
    alwaysApply?: boolean;
  };
  content: string;
  enabled: boolean;
}

interface RulesState {
  rules: RuleData[];
  isLoading: boolean;
  error: string | null;

  loadRules: () => Promise<void>;
  toggleRule: (id: string, enabled: boolean) => Promise<void>;
  saveRule: (id: string, fullContent: string) => Promise<{ success: boolean; error?: string }>;
  deleteRule: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const useRulesStore = create<RulesState>((set, get) => ({
  rules: [],
  isLoading: false,
  error: null,

  loadRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.electronAPI?.rules?.list();
      set({ rules: result?.rules ?? [], error: result?.error ?? null, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  toggleRule: async (id: string, enabled: boolean) => {
    const result = await window.electronAPI?.rules?.toggle(id, enabled);
    if (result?.success) {
      set(state => ({
        rules: state.rules.map(r => r.id === id ? { ...r, enabled } : r),
      }));
    }
  },

  saveRule: async (id: string, fullContent: string) => {
    const result = await window.electronAPI?.rules?.save(id, fullContent);
    if (result?.success) {
      await get().loadRules();
    }
    return { success: result?.success ?? false, error: result?.error ?? undefined };
  },

  deleteRule: async (id: string) => {
    const result = await window.electronAPI?.rules?.delete(id);
    if (result?.success) {
      set(state => ({ rules: state.rules.filter(r => r.id !== id) }));
    }
    return { success: result?.success ?? false, error: result?.error ?? undefined };
  },
}));
