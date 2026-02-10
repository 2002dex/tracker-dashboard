# Device List Integration - Next.js Dashboard

## Overview

This document describes the implementation of the Laravel API device list integration in the Next.js dashboard. The implementation replaces the static JSON file with dynamic data from the Laravel backend.

## Implementation Details

### 1. **API Types** (`lib/types/api.ts`)
- Complete TypeScript interfaces for Laravel API responses
- Type-safe data structures for device information
- Processed device types for dropdown display

### 2. **Device API Service** (`lib/services/device-api.ts`)
- Service class for communicating with Laravel backend
- Device data processing for dropdown display
- Error handling and response formatting
- Utility functions for styling and icons

### 3. **Custom Hook** (`hooks/use-device-list.ts`)
- React hook for managing device list state
- Auto-refresh functionality (every minute)
- Error handling and retry mechanisms
- Loading states and user feedback

### 4. **Authentication Context** (`lib/contexts/auth-context.tsx`)
- User authentication state management
- Integration with Laravel login API
- User information storage and retrieval
- Session management

### 5. **Updated Components**
- **Dashboard Header**: Enhanced device dropdown with Laravel API integration
- **Login Page**: Updated to use auth context
- **Main Page**: Updated to use auth context and pass user data

## Features

### Enhanced Device Dropdown
- **Real-time Data**: Fetches live device data from Laravel API
- **Role-based Access**: Shows different devices based on user role
- **Rich Information**: Displays device details, train info, tank levels
- **Status Indicators**: Visual indicators for connection status
- **Error Handling**: Graceful error states with retry functionality
- **Auto-refresh**: Automatic updates every minute
- **Loading States**: Proper loading indicators

### Device Information Display
Each device in the dropdown shows:
- **Device Name**: Train name + coach name or coach number
- **Device ID**: Full device identifier
- **Coach Information**: Railway-type-number format
- **Train Information**: Train number and current station
- **Tank Level**: Current tank level with percentage
- **Connection Status**: Connected/disconnected with icons
- **Last Update**: Human-readable timestamp
- **Visual Indicators**: Color-coded badges for status

### Authentication Integration
- **User Context**: Global user state management
- **Role-based UI**: Different views for admin/user roles
- **Session Management**: Proper login/logout flow
- **User Profile**: Dynamic user information in header

## API Integration

### Laravel API Endpoint
```
GET {LARAVEL_BASE_URL}/api/device-list?user_id={userId}
```

### Response Format
The API returns data matching the `device-list-endpoint.md` specification:
```json
{
  "success": true,
  "message": "Device list retrieved successfully",
  "data": {
    "devices": [...],
    "total_count": 10,
    "user_role": 1,
    "timestamp": "2023-05-15T22:20:00.000000Z"
  }
}
```

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

### Auto-refresh Settings
- **Interval**: 60 seconds (configurable)
- **Enabled**: Yes (can be disabled)
- **Error Retry**: Manual retry button available

## User Roles

### Admin (role = 1) & Train Admin (role = 4)
- Can view **all devices** in the system
- Dropdown header shows \"Admin View - All Devices\"
- No filtering applied

### Regular Users (role = 2, 3, etc.)
- Only see devices from assigned trains
- Dropdown header shows \"Your Assigned Devices\"
- Filtered based on `assigned_user_ids` in trains table

## Error Handling

### Network Errors
- Connection failures
- Timeout errors
- Invalid responses

### API Errors
- Authentication required (401)
- Invalid user ID (401)
- Server errors (500)

### UI Error States
- Error message display in dropdown
- Retry button for failed requests
- Fallback to empty state
- Red border on dropdown trigger for errors

## Performance Optimizations

### Caching
- Device list cached in React state
- Auto-refresh prevents stale data
- Error states preserved until successful retry

### UI Optimizations
- Virtualized dropdown for large device lists
- Debounced search (if implemented)
- Smooth animations and transitions
- Responsive design for mobile devices

## Testing

### Manual Testing Steps
1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Login Process**
   - Use Laravel admin credentials
   - Verify authentication works
   - Check user profile shows correct data

3. **Device Dropdown**
   - Click device dropdown
   - Verify devices load from Laravel API
   - Check device information is displayed correctly
   - Test refresh button functionality

4. **Error Testing**
   - Stop Laravel server temporarily
   - Verify error state displays correctly
   - Test retry functionality

### Expected Behavior
- Dropdown should show devices from Laravel API
- Loading states should appear during fetch
- Error states should show retry options
- Device selection should work properly
- Auto-refresh should update data periodically

## Troubleshooting

### Common Issues

#### \"Failed to load devices\" Error
- Check Laravel server is running on port 8000
- Verify CORS settings in Laravel
- Check network connectivity
- Verify API endpoint exists

#### Empty Device List
- Check user role in Laravel
- Verify user has assigned trains (for non-admin users)
- Check device data exists in Laravel database
- Verify `enabled_api = 1` for devices

#### Authentication Issues
- Check `NEXT_PUBLIC_API_BASE_URL` environment variable
- Verify Laravel login endpoint works
- Check browser developer tools for API errors

### Debug Mode
Enable console logging in the device API service to debug API calls:
```javascript
console.log('Fetching device list from:', url.toString());
console.log('Device list response:', data);
```

## Future Enhancements

### Suggested Improvements
1. **Real-time Updates**: WebSocket integration for live updates
2. **Search Functionality**: Filter devices by name, ID, or train
3. **Favorites**: Allow users to mark favorite devices
4. **Notifications**: Alert for device status changes
5. **Offline Mode**: Cache devices for offline viewing
6. **Performance**: Implement virtual scrolling for large lists

### API Enhancements
1. **Pagination**: Support for large device lists
2. **Filtering**: Server-side filtering options
3. **Sorting**: Multiple sort options
4. **Caching**: Redis caching for better performance
