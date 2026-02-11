# Routing Documentation

This document describes the routing structure for the Tracker Dashboard application.

## Routes

### Root Route
- **Path**: `/`
- **File**: `app/page.tsx`
- **Purpose**: Entry point that redirects based on authentication status
  - If authenticated → redirects to `/dashboard`
  - If not authenticated → redirects to `/login`
  - Shows loading state while checking auth

### Login Route
- **Path**: `/login`
- **File**: `app/login/page.tsx`
- **Purpose**: User authentication page
  - Displays login form
  - Auto-redirects to `/dashboard` if user is already authenticated
  - On successful login, redirects to `/dashboard`

### Dashboard Route
- **Path**: `/dashboard`
- **File**: `app/dashboard/page.tsx`
- **Purpose**: Main application dashboard (protected route)
  - Displays device list, map, and device details
  - Auto-redirects to `/login` if user is not authenticated
  - Handles device selection and logout

## API Endpoints

### Logout API
- **Path**: `/api/logout`
- **Method**: `POST`
- **File**: `app/api/logout/route.ts`
- **Purpose**: Server-side logout endpoint
  - Invalidates token on Laravel backend (optional)
  - Returns success/failure response
  - Client handles clearing localStorage and redirecting

## Authentication Flow

1. **Initial Load**
   - User accesses `/`
   - Root page checks auth status via context
   - Shows loading state while auth check completes

2. **Not Authenticated**
   - Redirects to `/login`
   - User enters credentials
   - On successful login, redirects to `/dashboard`

3. **Authenticated**
   - Redirects to `/dashboard`
   - Dashboard is protected and requires authentication
   - User can interact with devices and settings

4. **Logout**
   - User clicks logout in dashboard header
   - `handleLogout()` calls `logout()` from auth context
   - Auth context clears localStorage and auth state
   - User redirected to `/login`

## Protection Mechanism

All routes check authentication status using the `useAuth()` hook:
- Protected routes auto-redirect unauthenticated users to `/login`
- Public routes (login, root) auto-redirect authenticated users to `/dashboard`
- Loading states prevent flash of wrong content during auth check

## Future Enhancements

Consider adding:
- Middleware for more robust route protection
- Role-based access control (RBAC) for different user types
- Permission-based feature access
