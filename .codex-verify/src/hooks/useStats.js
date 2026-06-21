"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStats = useStats;
const react_1 = require("react");
const statsStore_1 = require("../store/statsStore");
function useStats() {
    const store = (0, statsStore_1.useStatsStore)();
    (0, react_1.useEffect)(() => {
        store.loadSummary();
        store.loadDailyStats();
    }, []);
    const refresh = (0, react_1.useCallback)(() => {
        store.refresh();
    }, []);
    return {
        summary: store.summary,
        dailyStats: store.dailyStats,
        loading: store.loading,
        refresh,
    };
}
