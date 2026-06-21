"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useReminder = useReminder;
const react_1 = require("react");
const reminderService_1 = require("../services/reminderService");
const settingsService_1 = require("../services/settingsService");
const service = new reminderService_1.ReminderService();
const settingsService = new settingsService_1.SettingsService();
function useReminder() {
    const [config, setConfig] = (0, react_1.useState)({
        enabled: false,
        intervalDays: 7,
    });
    const [permissionGranted, setPermissionGranted] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        checkPermissions();
        loadConfig();
    }, []);
    const checkPermissions = async () => {
        const status = await service.getPermissionsStatus();
        setPermissionGranted(status === 'granted');
    };
    const loadConfig = async () => {
        try {
            const scheduled = await service.getAllScheduled();
            const intervalValue = await settingsService.getValue('reminder_interval', '7');
            setConfig({
                enabled: scheduled.length > 0,
                intervalDays: Number.parseInt(intervalValue, 10) || 7,
            });
        }
        catch {
            setConfig({ enabled: false, intervalDays: 7 });
        }
    };
    const requestPermission = (0, react_1.useCallback)(async () => {
        const granted = await service.requestPermission();
        setPermissionGranted(granted);
        return granted;
    }, []);
    const updateConfig = (0, react_1.useCallback)(async (newConfig) => {
        setLoading(true);
        const updated = { ...config, ...newConfig };
        if (updated.enabled && !permissionGranted) {
            const granted = await requestPermission();
            if (!granted) {
                setLoading(false);
                return false;
            }
        }
        await service.scheduleUnreadReminders({
            enabled: updated.enabled,
            intervalDays: updated.intervalDays,
            dailyLimit: 3,
        });
        await settingsService.setValue('reminder_interval', String(updated.intervalDays));
        setConfig(updated);
        setLoading(false);
        return true;
    }, [config, permissionGranted, requestPermission]);
    return {
        config,
        permissionGranted,
        loading,
        requestPermission,
        updateConfig,
    };
}
