import { create } from 'zustand';
import { Achievement } from '../types';
import { AchievementService } from '../services/achievementService';

const achievementService = new AchievementService();

interface AchievementState {
  achievements: Achievement[];
  latestUnlocked: Achievement | null;

  loadAchievements: () => Promise<void>;
  refresh: () => Promise<void>;
  checkAchievements: () => Promise<Achievement[]>;
  clearLatestUnlocked: () => void;
}

export const useAchievementStore = create<AchievementState>((set) => ({
  achievements: [],
  latestUnlocked: null,

  loadAchievements: async () => {
    const achievements = await achievementService.getAll();
    set({ achievements });
  },

  refresh: async () => {
    const achievements = await achievementService.getAll();
    set({ achievements });
  },

  checkAchievements: async () => {
    const context = await achievementService.getContext();
    const unlocked = await achievementService.checkAndUnlock(context);
    await useAchievementStore.getState().loadAchievements();
    if (unlocked.length > 0) {
      set({ latestUnlocked: unlocked[0] });
    }
    return unlocked;
  },

  clearLatestUnlocked: () => set({ latestUnlocked: null }),
}));
