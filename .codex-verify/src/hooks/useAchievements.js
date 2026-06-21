"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAchievements = useAchievements;
const react_1 = require("react");
const achievementStore_1 = require("../store/achievementStore");
function useAchievements() {
    const store = (0, achievementStore_1.useAchievementStore)();
    (0, react_1.useEffect)(() => {
        store.loadAchievements();
        store.checkAchievements();
    }, []);
    const check = (0, react_1.useCallback)(async () => {
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
