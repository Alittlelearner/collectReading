"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAchievementStore = void 0;
const zustand_1 = require("zustand");
const achievementService_1 = require("../services/achievementService");
const achievementService = new achievementService_1.AchievementService();
exports.useAchievementStore = (0, zustand_1.create)((set) => ({
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
        await exports.useAchievementStore.getState().loadAchievements();
        if (unlocked.length > 0) {
            set({ latestUnlocked: unlocked[0] });
        }
        return unlocked;
    },
    clearLatestUnlocked: () => set({ latestUnlocked: null }),
}));
