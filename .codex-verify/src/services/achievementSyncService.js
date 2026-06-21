"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAchievements = syncAchievements;
const achievementStore_1 = require("../store/achievementStore");
async function syncAchievements() {
    await achievementStore_1.useAchievementStore.getState().checkAchievements();
}
