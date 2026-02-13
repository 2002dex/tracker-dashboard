// Types based on Laravel API device-list endpoint response format

// API location data from MAC-based geolocation
export interface ApiLocation {
  location: {
    lat: number;
    lng: number;
  };
  accuracy: number;
}

// Device details containing location and sleep_time info
export interface DeviceDetailsInfo {
  latitude?: string;
  longitude?: string;
  altitude?: string;
  speed?: string;
  sleep_time?: string;
  sleep?: string; // New field for sleep time
  battery?: string;
  mac_low?: string;
  mac_high?: string;
  rssi?: string;
  mac_address?: string;
  mac_addr?: string[]; // New field: array of MAC addresses (up to 3 access points)
  api_loc?: ApiLocation; // New field: MAC-based geolocation
  google_location?: {
    location: {
      lat: number;
      lng: number;
    };
    accuracy: number;
  };
}

export interface DeviceData {
  device_id: string;
  device_tag?: string;
  device_type: string;
  device_details: DeviceDetailsInfo | null;
  ccsp_attributes: any | null;
  version: string;
  device_status: any | null; // 0 = pending (yellow), 1 = active/idle (green)
  created_at: string;
  updated_at: string;
}

export interface DeviceListResponse {
  success: boolean;
  message: string;
  data: {
    devices: DeviceData[];
    total_count: number;
  } | null;
  error?: string;
}

export interface ApiError {
  success: false;
  message: string;
  data: null;
  error?: string;
}

// Device Details API Types
export interface DeviceDetailsRecord {
  device_id: string;
  device_timestamp: string;
  device_data: {
    [key: string]: any;
    // GPS data fields
    latitude?: string;
    longitude?: string;
    altitude?: string;
    speed?: string;
    // MAC address fields (legacy)
    mac_low?: string;
    mac_high?: string;
    mac_address?: string;
    // New MAC address array (3 access points)
    mac_addr?: string[];
    // Sleep time fields
    sleep_time?: string;
    sleep?: string; // New field for sleep time
    // MAC-based geolocation (new format)
    api_loc?: ApiLocation;
    // Google location data from MAC address (legacy)
    google_location?: {
      location: {
        lat: number;
        lng: number;
      };
      accuracy: number;
    };
    // Other possible fields
    rssi?: string;
    msg?: string;
  };
}

export interface DeviceDetailsData {
  device_id: string;
  records: DeviceDetailsRecord[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface DeviceDetailsResponse {
  success: boolean;
  message: string;
  data: DeviceDetailsData | null;
  error?: string;
}

// Processed GPS coordinates for mapping
export interface ProcessedGPSLocation {
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude?: string;
  speed?: string;
  device_id: string;
}

// Processed MAC address location data
export interface ProcessedMACLocation {
  timestamp: string;
  latitude: number;
  longitude: number;
  mac_address: string;
  mac_addresses?: string[]; // All MAC addresses from access points
  rssi?: string;
  accuracy?: number;
  device_id: string;
  location_source: 'google' | 'api' | 'estimated';
}

// Processed device for dropdown display
export interface ProcessedDeviceForDropdown {
  device_id: string;
  device_type: string;
  display_name: string;
  connection_status: 'connected' | 'disconnected';
  sleep_time?: number; 
  status?: number; // 0 = pending, 1 = idle/active
  battery?: number; // Battery percentage (0-100)
}

// Sleep time sync status for UI display
export type SleepTimeSyncStatus = 'idle' | 'pending' | 'confirmed' | 'failed';
