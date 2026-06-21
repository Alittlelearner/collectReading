import { Bookmark } from '../types';
import { ResurfaceConfig } from './resurfaceConfigService';

export class ResurfacePolicy {
  isEligible(bookmark: Bookmark, config: ResurfaceConfig, now = Date.now()): boolean {
    if (bookmark.learningStatus !== 'unread') return false;
    if (bookmark.resurfaceCount >= config.maxPerItem) return false;

    if (!bookmark.lastResurfacedAt) return true;

    const cooldownMs = config.cooldownDays * 86400000;
    return bookmark.lastResurfacedAt < now - cooldownMs;
  }

  sort(candidates: Bookmark[]): Bookmark[] {
    return [...candidates].sort((a, b) => {
      if (a.lastResurfacedAt == null && b.lastResurfacedAt != null) return -1;
      if (a.lastResurfacedAt != null && b.lastResurfacedAt == null) return 1;
      return a.createdAt - b.createdAt;
    });
  }
}
