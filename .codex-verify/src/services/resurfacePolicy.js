"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResurfacePolicy = void 0;
class ResurfacePolicy {
    isEligible(bookmark, config, now = Date.now()) {
        if (bookmark.learningStatus !== 'unread')
            return false;
        if (bookmark.resurfaceCount >= config.maxPerItem)
            return false;
        if (!bookmark.lastResurfacedAt)
            return true;
        const cooldownMs = config.cooldownDays * 86400000;
        return bookmark.lastResurfacedAt < now - cooldownMs;
    }
    sort(candidates) {
        return [...candidates].sort((a, b) => {
            if (a.lastResurfacedAt == null && b.lastResurfacedAt != null)
                return -1;
            if (a.lastResurfacedAt != null && b.lastResurfacedAt == null)
                return 1;
            return a.createdAt - b.createdAt;
        });
    }
}
exports.ResurfacePolicy = ResurfacePolicy;
