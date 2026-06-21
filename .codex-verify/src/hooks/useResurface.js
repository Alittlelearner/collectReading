"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useResurface = useResurface;
const react_1 = require("react");
const resurfaceStore_1 = require("../store/resurfaceStore");
function useResurface() {
    const store = (0, resurfaceStore_1.useResurfaceStore)();
    (0, react_1.useEffect)(() => {
        store.loadCandidates();
    }, []);
    const refresh = (0, react_1.useCallback)(() => {
        store.loadCandidates();
    }, []);
    return {
        candidates: store.candidates,
        currentIndex: store.currentIndex,
        loading: store.loading,
        skip: store.skip,
        done: store.done,
        refresh,
    };
}
