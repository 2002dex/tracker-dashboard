import { useState, useEffect, useCallback } from 'react';
import { deviceApi } from '@/lib/services/device-api';
import { ProcessedDeviceForDropdown, DeviceData } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';

interface UseDeviceListOptions {
  userId?: string;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

interface UseDeviceListReturn {
  devices: ProcessedDeviceForDropdown[];
  rawDevices: DeviceData[];
  loading: boolean;
  error: string | null;
  userRole: number | null;
  totalCount: number;
  lastUpdated: string | null;
  refreshDevices: () => Promise<void>;
  retryFetch: () => Promise<void>;
  getDeviceSleepTime: (deviceId: string) => number | null;
  getDeviceStatus: (deviceId: string) => number | null;
  getDeviceBattery: (deviceId: string) => number | null;
}

export function useDeviceList(options: UseDeviceListOptions = {}): UseDeviceListReturn {
  const { userId, refreshInterval = 30000, autoRefresh = false } = options;

  const [devices, setDevices] = useState<ProcessedDeviceForDropdown[]>([]);
  const [rawDevices, setRawDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setError(null);
      const response = await deviceApi.fetchDeviceList(userId);
      
      if (response.success && response.data) {
        const processedDevices = deviceApi.processDevicesForDropdown(response.data.devices);
        setDevices(processedDevices);
        setRawDevices(response.data.devices);
        setUserRole(null);
        setTotalCount(response.data.total_count);
        setLastUpdated(new Date().toISOString());
        logger.log(`Loaded ${processedDevices.length} devices`);
      } else {
        throw new Error(response.message || 'Failed to fetch device list');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Error in useDeviceList:', errorMessage);
      setDevices([]);
      setRawDevices([]);
      setUserRole(null);
      setTotalCount(0);
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshDevices = useCallback(async () => {
    await fetchDevices();
  }, [fetchDevices]);

  const retryFetch = useCallback(async () => {
    setLoading(true);
    await fetchDevices();
  }, [fetchDevices]);

  // Get sleep_time (in minutes) for a specific device
  const getDeviceSleepTime = useCallback((deviceId: string): number | null => {
    return deviceApi.getDeviceSleepTimeFromList(rawDevices, deviceId);
  }, [rawDevices]);

  // Get status for a specific device (0=pending, 1=idle/active)
  const getDeviceStatus = useCallback((deviceId: string): number | null => {
    return deviceApi.getDeviceStatusFromList(rawDevices, deviceId);
  }, [rawDevices]);

  // Get battery percentage for a specific device
  const getDeviceBattery = useCallback((deviceId: string): number | null => {
    return deviceApi.getDeviceBatteryFromList(rawDevices, deviceId);
  }, [rawDevices]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;
    const interval = setInterval(() => {
      if (!loading) fetchDevices();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loading, fetchDevices]);

  // Listen for cross-component refresh events so multiple hook instances
  // can refresh when another component updates device data.
  useEffect(() => {
    const handler = () => {
      fetchDevices();
    };
    window.addEventListener('deviceListRefresh', handler);
    return () => window.removeEventListener('deviceListRefresh', handler);
  }, [fetchDevices]);

  return {
    devices,
    rawDevices,
    loading,
    error,
    userRole,
    totalCount,
    lastUpdated,
    refreshDevices,
    retryFetch,
    getDeviceSleepTime,
    getDeviceStatus,
    getDeviceBattery,
  };
}
