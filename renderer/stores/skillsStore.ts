import { create } from 'zustand';

export interface SkillData {
  id: string;
  dirPath: string;
  filePath: string;
  name: string;
  description: string;
  content: string;
  enabled: boolean;
}

interface SkillsState {
  skills: SkillData[];
  isLoading: boolean;
  error: string | null;

  loadSkills: () => Promise<void>;
  saveSkill: (id: string, content: string) => Promise<{ success: boolean; error?: string }>;
  deleteSkill: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],
  isLoading: false,
  error: null,

  loadSkills: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.electronAPI?.skills?.list();
      set({ skills: result?.skills ?? [], error: result?.error ?? null, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  saveSkill: async (id: string, content: string) => {
    const result = await window.electronAPI?.skills?.save(id, content);
    if (result?.success) {
      await get().loadSkills();
    }
    return { success: result?.success ?? false, error: result?.error ?? undefined };
  },

  deleteSkill: async (id: string) => {
    const result = await window.electronAPI?.skills?.delete(id);
    if (result?.success) {
      set(state => ({ skills: state.skills.filter(s => s.id !== id) }));
    }
    return { success: result?.success ?? false, error: result?.error ?? undefined };
  },
}));
