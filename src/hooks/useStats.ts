import { useCallback, useEffect } from 'react';
import { useStatsStore } from '../store/statsStore';

export function useStats() {
  const store = useStatsStore();

  useEffect(() => {
    store.loadSummary();
    store.loadDailyStats();
  }, []);

  const refresh = useCallback(() => {
    store.refresh();
  }, []);

  return {
    summary: store.summary,
    dailyStats: store.dailyStats,
    loading: store.loading,
    refresh,
  };
}
