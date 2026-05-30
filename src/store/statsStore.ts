import { create } from 'zustand';
import { DailyStat, StatSummary } from '../types';
import { StatsService } from '../services/statsService';

const statsService = new StatsService();

interface StatsState {
  summary: StatSummary | null;
  dailyStats: DailyStat[];
  loading: boolean;

  loadSummary: () => Promise<void>;
  loadDailyStats: (days?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set) => ({
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
      useStatsStore.getState().loadSummary(),
      useStatsStore.getState().loadDailyStats(),
    ]);
  },
}));
