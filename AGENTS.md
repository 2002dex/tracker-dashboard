# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Tracker Dashboard is a Next.js 16 (App Router) application for real-time IoT device tracking and management. It integrates with a Laravel backend API for authentication and location data retrieval, displaying GPS and MAC-based location data on interactive maps using Leaflet/OpenStreetMap.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Environment Setup

Create `.env.local` in the project root:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

The Laravel backend must be running and configured with CORS to allow requests from the Next.js frontend.

## Architecture

### Core Data Flow
1. **Authentication**: `lib/contexts/auth-context.tsx` manages auth state via React Context, storing tokens in localStorage and cookies
2. **Device Data**: `lib/services/device-api.ts` (singleton `deviceApi`) handles all Laravel API communication
3. **State Management**: `hooks/use-device-list.ts` provides device list with caching and refresh capabilities
4. **UI Rendering**: Components consume data via hooks and context

### Key Directories
- `app/` - Next.js App Router pages (single-page app, main entry is `page.tsx`)
- `components/` - React components; `ui/` contains shadcn/ui primitives, root level has page-specific components
- `lib/services/` - API service layer (`device-api.ts` is the main API client)
- `lib/contexts/` - React Context providers (auth state)
- `lib/types/` - TypeScript interfaces for API responses
- `hooks/` - Custom React hooks for data fetching and UI state

### Main Components
- `app/page.tsx` - Root page that conditionally renders `LoginPage` or dashboard based on auth state
- `components/dashboard-content.tsx` - Main dashboard with device details, settings, and Leaflet map
- `components/dashboard-header.tsx` - Header with device selector dropdown and user menu
- `components/login-page.tsx` - Authentication form

### API Integration Pattern
All API calls go through `lib/services/device-api.ts`:
- `fetchDeviceList()` - GET `/api/device-list`
- `fetchDeviceDetails(deviceId)` - GET `/api/device/details/{deviceId}`
- `updateDeviceSleepTime(deviceId, minutes)` - POST `/api/device/sleep`
- `updateDeviceTag(deviceId, tag)` - POST `/api/device/tag`
- `extractGPSLocations()` / `extractMACLocations()` - Process device records into map-ready coordinates

### Location Data Types
- **GPS Locations**: Direct coordinates with lat/lng, altitude, speed
- **MAC Locations**: WiFi-based positioning using Google Geolocation API, includes accuracy radius

### UI Framework
- **Component Library**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS v4 with `cn()` utility from `lib/utils.ts` for class merging
- **Maps**: Leaflet with OpenStreetMap tiles (loaded dynamically client-side)
- **Forms**: react-hook-form with zod validation
- **Notifications**: sonner toast library via `hooks/use-toast.ts`

## Code Conventions

- All page components and context providers use `"use client"` directive
- API responses follow `{ success: boolean, message: string, data: T | null, error?: string }` pattern
- Device IDs are 12-character hex strings (e.g., `"041E7AFF0000"`)
- The `@/` path alias maps to the project root
- TypeScript strict mode is enabled

## Backend Requirements

Requires a Laravel API with these endpoints:
- `POST /api/login` - Authentication
- `GET /api/user` - Validate token / get user info
- `GET /api/device-list` - List all devices
- `GET /api/device/details/{deviceId}` - Device location records
- `POST /api/device/sleep` - Update device active time
- `POST /api/device/update` - Update device name

See `docs/laravel-cors-setup.md` for backend CORS configuration.
