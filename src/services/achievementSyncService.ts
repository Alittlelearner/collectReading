import { useAchievementStore } from '../store/achievementStore';

export async function syncAchievements(): Promise<void> {
  await useAchievementStore.getState().checkAchievements();
}
