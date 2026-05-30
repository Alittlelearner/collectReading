import { useCallback, useEffect } from 'react';
import { useAchievementStore } from '../store/achievementStore';

export function useAchievements() {
  const store = useAchievementStore();

  useEffect(() => {
    store.loadAchievements();
  }, []);

  const check = useCallback(async () => {
    return store.checkAchievements();
  }, []);

  return {
    achievements: store.achievements,
    latestUnlocked: store.latestUnlocked,
    check,
    refresh: store.refresh,
    clearLatestUnlocked: store.clearLatestUnlocked,
  };
}
