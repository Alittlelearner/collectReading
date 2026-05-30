import { useState, useCallback, useEffect } from 'react';
import { ReminderService } from '../services/reminderService';

const service = new ReminderService();

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
      setConfig({
        enabled: scheduled.length > 0,
        intervalDays: 7,
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
