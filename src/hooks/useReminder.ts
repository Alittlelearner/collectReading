import { useState, useCallback, useEffect } from 'react';
import { ReminderService } from '../services/reminderService';
import { SettingsService } from '../services/settingsService';

const service = new ReminderService();
const settingsService = new SettingsService();

interface ReminderConfig {
  enabled: boolean;
  intervalDays: number;
}

export function useReminder() {
  const [config, setConfig] = useState<ReminderConfig>({
    enabled: false,
    intervalDays: 7,
  });
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
    } catch {
      setConfig({ enabled: false, intervalDays: 7 });
    }
  };

  const requestPermission = useCallback(async () => {
    const granted = await service.requestPermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  const updateConfig = useCallback(
    async (newConfig: Partial<ReminderConfig>) => {
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
    },
    [config, permissionGranted, requestPermission],
  );

  return {
    config,
    permissionGranted,
    loading,
    requestPermission,
    updateConfig,
  };
}
