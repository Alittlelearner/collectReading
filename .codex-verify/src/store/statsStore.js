"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStatsStore = void 0;
const zustand_1 = require("zustand");
const statsService_1 = require("../services/statsService");
const statsService = new statsService_1.StatsService();
exports.useStatsStore = (0, zustand_1.create)((set) => ({
    summary: null,
    dailyStats: [],
    loading: false,
    loadSummary: async () => {
        set({ loading: true });
        const summary = await statsService.getSummary();
        set({ summary, loading: false });
    },
    loadDailyStats: async (days = 30) => {
        const dailyStats = await statsService.getDailyStats(days);
        set({ dailyStats });
    },
    refresh: async () => {
        await Promise.all([
            exports.useStatsStore.getState().loadSummary(),
            exports.useStatsStore.getState().loadDailyStats(),
        ]);
    },
}));
