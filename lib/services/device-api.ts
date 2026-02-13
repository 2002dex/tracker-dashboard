import { DeviceListResponse, ProcessedDeviceForDropdown, DeviceData, DeviceDetailsResponse, ProcessedGPSLocation, ProcessedMACLocation } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';

// Pagination options for device details fetching
export interface FetchDeviceDetailsOptions {
  page?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

class DeviceApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  }

  /**
   * Get auth token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Get common headers with auth token
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Fetch device list from Laravel API
   * @param userId - User ID for authentication (optional if using session auth)
   * @returns Promise<DeviceListResponse>
   */
  async fetchDeviceList(userId?: string): Promise<DeviceListResponse> {
    try {
      const url = new URL('/api/device-list', this.baseUrl);
      
      // Add user_id parameter if provided
      if (userId) {
        url.searchParams.append('user_id', userId);
      }

      logger.log('Fetching device list from:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders(),
          'Cache-Control': 'max-age=300',
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (response.status === 401) {
          errorMessage = 'Unauthorized: Please log in to access device list';
        } else if (response.status === 403) {
          errorMessage = 'Forbidden: You do not have permission to access this resource';
        } else if (response.status === 404) {
          errorMessage = 'Device list endpoint not found';
        } else if (response.status >= 500) {
          errorMessage = 'Server error: Please try again later';
        }
        
        throw new Error(errorMessage);
      }

      const data: DeviceListResponse = await response.json();
      if (!data || typeof data.success !== 'boolean') {
        throw new Error('Invalid response format from server');
      }
      
      if (data.success && data.data && data.data.devices) {
        logger.log('Device list response:', data);
      }
      return data;
    } catch (error) {
      logger.error('Error fetching device list:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return {
          success: false,
          message: 'Network error: Unable to connect to the server.',
          data: null,
          error: 'Network connection failed'
        };
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch device list',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch device details from Laravel API with pagination support
   * @param deviceId - Device ID to fetch details for
   * @param options - Pagination and filter options
   */
  async fetchDeviceDetails(deviceId: string, options: FetchDeviceDetailsOptions = {}): Promise<DeviceDetailsResponse> {
    try {
      const url = new URL(`/api/device/details/${encodeURIComponent(deviceId)}`, this.baseUrl);
      
      // Add pagination parameter
      if (options.page && options.page > 1) {
        url.searchParams.append('page', options.page.toString());
      }
      
      logger.log('Fetching device details from:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders(),
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (response.status === 401) {
          errorMessage = 'Unauthorized: Please log in to access device details';
        } else if (response.status === 403) {
          errorMessage = 'Forbidden: You do not have permission to access this device';
        } else if (response.status === 404) {
          errorMessage = 'Device not found or device details endpoint not available';
        } else if (response.status >= 500) {
          errorMessage = 'Server error: Please try again later';
        }
        
        throw new Error(errorMessage);
      }

      const data: DeviceDetailsResponse = await response.json();
      if (!data || typeof data.success !== 'boolean') {
        throw new Error('Invalid response format from server');
      }
      return data;
    } catch (error) {
      logger.error('Error fetching device details:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return {
          success: false,
          message: 'Network error: Unable to connect to the server. Please check your internet connection.',
          data: null,
          error: 'Network connection failed'
        };
      }
      
      // Return a structured error response
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch device details',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch multiple pages of device details until limit is reached or all pages are fetched
   * @param deviceId - Device ID to fetch details for
   * @param options - Pagination and filter options
   */
  async fetchDeviceDetailsWithPagination(
    deviceId: string, 
    options: FetchDeviceDetailsOptions = {}
  ): Promise<DeviceDetailsResponse> {
    const { limit = 10, startDate, endDate } = options;
    
    // Fetch first page
    const firstPageResponse = await this.fetchDeviceDetails(deviceId, { page: 1 });
    
    if (!firstPageResponse.success || !firstPageResponse.data) {
      return firstPageResponse;
    }

    const allRecords = [...firstPageResponse.data.records];
    const pagination = firstPageResponse.data.pagination;
    
    // If we need more records and there are more pages
    if (limit > 10 && pagination.last_page > 1) {
      const pagesToFetch = Math.min(
        Math.ceil(limit / pagination.per_page),
        pagination.last_page
      );
      
      for (let page = 2; page <= pagesToFetch; page++) {
        const pageResponse = await this.fetchDeviceDetails(deviceId, { page });
        if (pageResponse.success && pageResponse.data?.records) {
          allRecords.push(...pageResponse.data.records);
        }
        
        // Check if we have enough records
        if (allRecords.length >= limit) break;
      }
    }

    // Filter by date range if specified
    let filteredRecords = allRecords;
    if (startDate || endDate) {
      const fromTime = startDate ? new Date(startDate).getTime() : 0;
      const toTime = endDate ? new Date(endDate + 'T23:59:59').getTime() : Date.now();
      
      filteredRecords = allRecords.filter(record => {
        const recordTime = new Date(record.device_timestamp).getTime();
        return recordTime >= fromTime && recordTime <= toTime;
      });
    }

    // Apply limit
    const limitedRecords = filteredRecords.slice(0, limit);

    return {
      success: true,
      message: 'Device data history retrieved successfully',
      data: {
        device_id: deviceId,
        records: limitedRecords,
        pagination: {
          ...pagination,
          total: limitedRecords.length,
        }
      }
    };
  }

  /**
   * Update device sleep time (Active Time) via Laravel API
   * @param deviceId - Device ID
   * @param sleepMinutes - Sleep time in minutes (max 255)
   */
  async updateDeviceSleepTime(deviceId: string, sleepMinutes: number): Promise<{ success: boolean; message: string }> {
    try {
      const url = new URL('/api/device/sleep', this.baseUrl);

      const payload = {
        device_id: deviceId,
        sleep_time: String(sleepMinutes),
      };

      logger.log('Updating device sleep time via Laravel API:', url.toString(), payload);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = (data && (data.message || data.error)) || `HTTP error! status: ${response.status}`;
        return { success: false, message };
      }

      const success = data.success === true || data.status === true;
      const message: string = data.message || (success ? 'Sleep time updated successfully' : 'Failed to update sleep time');
      return { success, message };
    } catch (error) {
      logger.error('Error updating device sleep time:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update device sleep time',
      };
    }
  }

  /**
   * Process device data for dropdown display
   * Includes status field and battery from API
   */
  processDevicesForDropdown(devices: DeviceData[]): ProcessedDeviceForDropdown[] {
    return devices.map(device => {
      let displayName = device.device_tag?.trim() || device.device_type || device.device_id;
      if (!displayName || displayName === device.device_id) {
        displayName = device.device_id;
      }

      // sleep_time in minutes - check both sleep and sleep_time fields
      const sleepTimeStr = device.device_details?.sleep || device.device_details?.sleep_time;
      const sleepTime = sleepTimeStr ? parseInt(sleepTimeStr, 10) : undefined;
      
      // Get battery percentage from device_details
      const batteryStr = device.device_details?.battery;
      const battery = batteryStr ? parseInt(batteryStr, 10) : '51'; // Default to '51' 
      
      return {
        device_id: device.device_id,
        device_type: device.device_type,
        display_name: displayName,
        connection_status: 'disconnected' as const,
        sleep_time: !isNaN(sleepTime as number) ? sleepTime : undefined,
        status: device.device_status, // pass through status from API
        battery: battery !== undefined && !isNaN(battery) ? battery : undefined,
      };
    });
  }

  /**
   * Get sleep_time (in minutes) from a specific device in device list
   * Checks both 'sleep' and 'sleep_time' fields
   */
  getDeviceSleepTimeFromList(devices: DeviceData[], deviceId: string): number | null {
    const device = devices.find(d => d.device_id === deviceId);
    const sleepStr = device?.device_details?.sleep || device?.device_details?.sleep_time;
    if (!sleepStr) return null;
    const sleepTime = parseInt(sleepStr, 10);
    return isNaN(sleepTime) ? null : sleepTime;
  }

  /**
   * Get status field from a specific device in device list
   * @returns 0 (pending) or 1 (idle/active) or null
   */
  getDeviceStatusFromList(devices: DeviceData[], deviceId: string): number | null {
    const device = devices.find(d => d.device_id === deviceId);
    if (device?.device_status === undefined || device?.device_status === null) return null;
    return device.device_status;
  }

  /**
   * Get battery percentage from a specific device in device list
   * @returns battery percentage (0-100) or null if not available
   */
  getDeviceBatteryFromList(devices: DeviceData[], deviceId: string): number | null {
    const device = devices.find(d => d.device_id === deviceId);
    const batteryStr = device?.device_details?.battery;
    if (!batteryStr) return null;
    const battery = parseInt(batteryStr, 10);
    return isNaN(battery) ? null : battery;
  }

  /**
   * Extract sleep_time from device details records (most recent)
   * Checks both 'sleep' and 'sleep_time' fields
   */
  extractSleepTimeFromDetails(deviceDetails: DeviceDetailsResponse): number | null {
    if (!deviceDetails.success || !deviceDetails.data?.records) return null;

    for (const record of deviceDetails.data.records) {
      // Check for new 'sleep' field first, then fall back to 'sleep_time'
      const sleepStr = record.device_data?.sleep || record.device_data?.sleep_time;
      if (sleepStr) {
        const sleepTime = parseInt(sleepStr, 10);
        if (!isNaN(sleepTime)) return sleepTime;
      }
    }
    return null;
  }

  /**
   * Update device properties via Laravel API
   */
  async updateDevice(deviceId: string, key: string, value: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const url = new URL(`/api/device/update/${encodeURIComponent(deviceId)}`, this.baseUrl);
      url.searchParams.append(key, value);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = (data && (data.message || data.error)) || `HTTP error! status: ${response.status}`;
        return { success: false, message };
      }

      const success = data.success === true || data.status === true;
      const message: string = data.message || (success ? 'Device updated successfully' : 'Failed to update device');
      return { success, message, data: data.data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to update device' };
    }
  }

  /**
   * Update device tag/name
   */
  async updateDeviceTag(deviceId: string, deviceTag: string): Promise<{ success: boolean; message: string }> {
    return this.updateDevice(deviceId, 'device_tag', deviceTag);
  }

  /**
   * Extract GPS coordinates from device details response
   */
  extractGPSLocations(deviceDetails: DeviceDetailsResponse): ProcessedGPSLocation[] {
    if (!deviceDetails.success || !deviceDetails.data || !deviceDetails.data.records) return [];

    const gpsLocations: ProcessedGPSLocation[] = [];
    const records = [...deviceDetails.data.records];
    
    for (const record of records) {
      if (gpsLocations.length >= 10) break;
      if (record.device_data && this.hasGPSData(record.device_data)) {
        const location = this.parseGPSFromDeviceData(record, deviceDetails.data.device_id);
        if (location) gpsLocations.push(location);
      }
    }
    return gpsLocations;
  }

  /**
   * Extract MAC address location data from device details response
   */
  extractMACLocations(deviceDetails: DeviceDetailsResponse): ProcessedMACLocation[] {
    if (!deviceDetails.success || !deviceDetails.data || !deviceDetails.data.records) return [];

    const macLocations: ProcessedMACLocation[] = [];
    const records = [...deviceDetails.data.records];
    
    for (const record of records) {
      if (macLocations.length >= 10) break;
      if (record.device_data && this.hasMACLocationData(record.device_data)) {
        const location = this.parseMACFromDeviceData(record, deviceDetails.data.device_id);
        if (location) macLocations.push(location);
      }
    }
    return macLocations;
  }

  private hasGPSData(deviceData: any): boolean {
    const hasLatitude = deviceData.latitude !== undefined;
    const hasLongitude = deviceData.longitude !== undefined;
    const hasMacLow = deviceData.mac_low !== undefined;
    const hasMacHigh = deviceData.mac_high !== undefined;
    const hasMacAddress = deviceData.mac_address !== undefined;
    const hasMacAddr = deviceData.mac_addr !== undefined; // New format
    const hasGoogleLocation = deviceData.google_location !== undefined;
    const hasApiLoc = deviceData.api_loc !== undefined; // New format
    return (hasLatitude && hasLongitude) && !(hasMacLow || hasMacHigh || hasMacAddress || hasGoogleLocation || hasMacAddr || hasApiLoc);
  }

  private hasMACLocationData(deviceData: any): boolean {
    const hasMacAddress = deviceData.mac_address !== undefined;
    const hasMacAddr = deviceData.mac_addr !== undefined && Array.isArray(deviceData.mac_addr); // New format
    const hasGoogleLocation = deviceData.google_location !== undefined && deviceData.google_location.location !== undefined;
    const hasApiLoc = deviceData.api_loc !== undefined && deviceData.api_loc.location !== undefined; // New format
    const hasMacFields = (deviceData.mac_low !== undefined && deviceData.mac_high !== undefined);
    
    // Support new api_loc format or legacy google_location format
    const hasLocation = hasGoogleLocation || hasApiLoc;
    const hasMac = hasMacAddress || hasMacFields || hasMacAddr;
    return hasMac && hasLocation;
  }

  private parseGPSFromDeviceData(record: any, deviceId: string): ProcessedGPSLocation | null {
    const { device_data, device_timestamp } = record;
    if (!device_data.latitude || !device_data.longitude) return null;
    
    try {
      const latValue = this.parseCoordinate(device_data.latitude);
      const lngValue = this.parseCoordinate(device_data.longitude);
      if (latValue === null || lngValue === null) return null;
      
      return {
        timestamp: device_data.timestamp || device_timestamp,
        latitude: latValue,
        longitude: lngValue,
        altitude: device_data.altitude,
        speed: device_data.speed,
        device_id: deviceId
      };
    } catch { return null; }
  }

  private parseMACFromDeviceData(record: any, deviceId: string): ProcessedMACLocation | null {
    const { device_data, device_timestamp } = record;
    
    try {
      let lat: number;
      let lng: number;
      let accuracy: number | undefined;
      let locationSource: 'google' | 'api' | 'estimated' = 'google';
      
      // Check for new api_loc format first
      if (device_data.api_loc?.location) {
        lat = device_data.api_loc.location.lat;
        lng = device_data.api_loc.location.lng;
        accuracy = device_data.api_loc.accuracy;
        locationSource = 'api';
      } else if (device_data.google_location?.location) {
        // Fall back to legacy google_location format
        lat = device_data.google_location.location.lat;
        lng = device_data.google_location.location.lng;
        accuracy = device_data.google_location.accuracy;
        locationSource = 'google';
      } else {
        return null;
      }
      
      // Get MAC addresses - support new mac_addr array or legacy formats
      let macAddress: string;
      let macAddresses: string[] | undefined;
      
      if (device_data.mac_addr && Array.isArray(device_data.mac_addr)) {
        // New format: array of MAC addresses from access points
        macAddresses = device_data.mac_addr;
        macAddress = device_data.mac_addr[0] || 'Unknown';
      } else if (device_data.mac_address) {
        macAddress = device_data.mac_address;
      } else if (device_data.mac_high && device_data.mac_low) {
        macAddress = `${device_data.mac_high}${device_data.mac_low}`.toUpperCase();
      } else {
        macAddress = 'Unknown';
      }
      
      if (typeof lat !== 'number' || typeof lng !== 'number') return null;
      
      return {
        timestamp: device_data.timestamp || device_timestamp,
        latitude: lat,
        longitude: lng,
        mac_address: macAddress,
        mac_addresses: macAddresses,
        rssi: device_data.rssi,
        accuracy: accuracy,
        device_id: deviceId,
        location_source: locationSource
      };
    } catch { return null; }
  }

  private parseCoordinate(coordStr: string): number | null {
    if (!coordStr || typeof coordStr !== 'string') return null;
    const match = coordStr.trim().match(/([0-9.-]+)\s*([NSEW])?/i);
    if (!match) return null;
    let value = parseFloat(match[1]);
    const direction = match[2]?.toUpperCase();
    if (isNaN(value)) return null;
    if (direction === 'S' || direction === 'W') value = -Math.abs(value);
    return value;
  }

  /**
   * Get the most recent last active time from both GPS and MAC location data
   */
  getLastActiveTime(deviceDetails: DeviceDetailsResponse): string | null {
    if (!deviceDetails.success || !deviceDetails.data || !deviceDetails.data.records) return null;

    let mostRecentTimestamp: string | null = null;
    let mostRecentTime = 0;

    for (const record of deviceDetails.data.records) {
      const deviceDataTimestamp = record.device_data?.timestamp;
      if (deviceDataTimestamp) {
        const time = new Date(deviceDataTimestamp).getTime();
        if (time > mostRecentTime) {
          mostRecentTime = time;
          mostRecentTimestamp = deviceDataTimestamp;
        }
      }
      if (!deviceDataTimestamp && record.device_timestamp) {
        const time = new Date(record.device_timestamp).getTime();
        if (time > mostRecentTime) {
          mostRecentTime = time;
          mostRecentTimestamp = record.device_timestamp;
        }
      }
    }
    return mostRecentTimestamp;
  }

  getLocationStatistics(deviceDetails: DeviceDetailsResponse) {
    const gpsLocations = this.extractGPSLocations(deviceDetails);
    const macLocations = this.extractMACLocations(deviceDetails);
    const lastActiveTime = this.getLastActiveTime(deviceDetails);
    return {
      gpsCount: gpsLocations.length,
      macCount: macLocations.length,
      totalLocations: gpsLocations.length + macLocations.length,
      lastActiveTime,
      hasLocationData: gpsLocations.length > 0 || macLocations.length > 0
    };
  }
}

export const deviceApi = new DeviceApiService();
export default DeviceApiService;
