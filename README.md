# Tracker Dashboard

A modern web application for device tracking and management with user authentication and real-time location data visualization. The dashboard integrates with a Laravel backend API for authentication and location data retrieval.

## Features

*   **User Authentication**: Secure login integration with Laravel backend API.
*   **Dashboard**: Overview of key metrics and device statistics.
*   **Device Management**:
    *   List of devices with search, sorting, and pagination.
    *   Detailed view for each device, showing historical location data.
    *   Real-time location tracking with Google Maps integration.
*   **Location Data**:
    *   Fetches device locations from Laravel backend API.
    *   Displays historical tracking data with timestamps and coordinates.
    *   Support for GPS coordinates and device MAC addresses.
*   **Responsive Design**: Mobile-friendly interface built with React and Tailwind CSS.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: [LTS version recommended](https://nodejs.org/en/download/) (v18+)
*   **npm** or **pnpm**: Package managers for Node.js (comes with Node.js)
*   **Git**: [Download Git](https://git-scm.com/downloads)
*   **Laravel Backend API**: The application requires a running Laravel backend API for authentication and location data. See [Laravel CORS Setup Guide](docs/laravel-cors-setup.md) for API configuration.
*   **Web Browser**: Modern browser with JavaScript enabled (Chrome, Firefox, Safari, Edge)

## Dependencies

The project uses the following Node packages. Install them via `npm install` or `pnpm install` (they are already listed in `package.json`).

### Production Dependencies

- @hookform/resolvers: ^3.10.0
- @radix-ui/react-accordion: 1.2.2
- @radix-ui/react-alert-dialog: 1.1.4
- @radix-ui/react-aspect-ratio: 1.1.1
- @radix-ui/react-avatar: 1.1.2
- @radix-ui/react-checkbox: 1.1.3
- @radix-ui/react-collapsible: 1.1.2
- @radix-ui/react-context-menu: 2.2.4
- @radix-ui/react-dialog: 1.1.4
- @radix-ui/react-dropdown-menu: 2.1.4
- @radix-ui/react-hover-card: 1.1.4
- @radix-ui/react-label: 2.1.1
- @radix-ui/react-menubar: 1.1.4
- @radix-ui/react-navigation-menu: 1.2.3
- @radix-ui/react-popover: 1.1.4
- @radix-ui/react-progress: 1.1.1
- @radix-ui/react-radio-group: 1.2.2
- @radix-ui/react-scroll-area: 1.2.2
- @radix-ui/react-select: 2.1.4
- @radix-ui/react-separator: 1.1.1
- @radix-ui/react-slider: 1.2.2
- @radix-ui/react-slot: 1.1.1
- @radix-ui/react-switch: 1.1.2
- @radix-ui/react-tabs: 1.1.2
- @radix-ui/react-toast: 1.2.4
- @radix-ui/react-toggle: 1.1.1
- @radix-ui/react-toggle-group: 1.1.1
- @radix-ui/react-tooltip: 1.1.6
- autoprefixer: ^10.4.20
- class-variance-authority: ^0.7.1
- clsx: ^2.1.1
- cmdk: 1.0.4
- date-fns: 4.1.0
- embla-carousel-react: 8.5.1
- geist: ^1.3.1
- input-otp: 1.4.1
- lucide-react: ^0.454.0
- next: ^16.1.6
- next-themes: ^0.4.6
- react: ^18.3.1
- react-day-picker: 9.8.0
- react-dom: ^18.3.1
- react-hook-form: ^7.60.0
- react-resizable-panels: ^2.1.7
- recharts: 2.15.4
- sonner: ^1.7.4
- tailwind-merge: ^2.5.5
- tailwindcss-animate: ^1.0.7
- vaul: ^0.9.9
- zod: 3.25.67

### Dev Dependencies

- @tailwindcss/postcss: ^4.1.9
- @types/node: ^22
- @types/react: ^18
- @types/react-dom: ^18
- eslint: ^9.39.2
- eslint-config-next: 16.1.6
- postcss: ^8.5
- tailwindcss: ^4.1.9
- tw-animate-css: 1.3.3
- typescript: ^5

## Local Setup

Follow these steps to get the project running on your local machine.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```
Replace `<repository-url>` with the actual URL of your cloned project and `<repository-name>` with the name of the directory.

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Variables Setup

Create a `.env.local` file in the root of your project with the following configuration:

```
# Laravel API Configuration
# Base URL of your Laravel app (without /api suffix)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**Important Notes:**
- Replace `http://localhost:8000` with your actual Laravel API base URL
- The `NEXT_PUBLIC_` prefix makes these variables accessible in the browser
- Ensure your Laravel backend is properly configured with CORS to allow requests from your Next.js frontend
- Refer to [Laravel CORS Setup](docs/laravel-cors-setup.md) for detailed backend configuration

### 4. Run the Development Server

```bash
npm run dev
# or
pnpm dev
```

The application should now be running on `http://localhost:3000` (or another available port).

You should see the login page. Use your credentials from the Laravel backend to log in.

## Accessing the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

### Login Flow

1.  **Login Page**: Enter your credentials (email and password) registered in the Laravel backend
2.  **Authentication**: The application will authenticate against the Laravel API
3.  **Dashboard**: After successful login, you'll see the dashboard with key metrics and statistics
4.  **Devices Page**: Navigate to "Devices" in the sidebar to view all available devices
5.  **Device Details**: Click on any device to see:
    *   Historical location data in a table
    *   Location visualization on Google Maps
    *   Device information (Device ID, MAC address, etc.)

## API Integration

The dashboard communicates with a Laravel backend API for the following operations:

### Authentication Endpoints
- **POST** `/login` - User authentication
- **POST** `/logout` - User logout

### Device Endpoints
- **GET** `/api/device-list` - List all devices
- **GET** `/api/device/details/{deviceId}` - Get specific device details

### Location Data Endpoints
- **GET** `/api/device/details/{deviceId}` - Returns device records including GPS and MAC-based location data

### Device Sleep / Active Time Endpoint
- **POST** `/api/device/sleep` - Set the sleep (active) time for a device

  **Request body example** (see `sleep_time.json`):
  ```json
  {
    "device_id": "041E7AFF0000",
    "sleep_time": "20"
  }
  ```

  **Success response example** (see `sleep_time_res.json`):
  ```json
  {
    "success": true,
    "message": "Publish job queued",
    "data": {
      "topic": "tracker/pub/041E7AFF0000",
      "payload": {
        "device_id": "041E7AFF0000",
        "sleep_time": "20"
      }
    }
  }
  ```

All API responses are handled through the application's API service layer in `lib/services/device-api.ts`.

  ### Device Update Endpoint (new)

  The frontend supports updating generic device properties via a dedicated device update endpoint and a specific sleep-time endpoint:

  - `POST /api/device/update/{deviceId}` — Generic update endpoint: the frontend calls this endpoint with query parameters for the property to update. Example (frontend uses `lib/services/device-api.ts` `updateDevice`):

  ```
  POST /api/device/update/041E7AFF0000?device_tag=NewName
  ```

  The endpoint returns a JSON response with `success` and `message` fields. The frontend's `updateDeviceTag(deviceId, deviceTag)` helper wraps this call.

  - `POST /api/device/sleep` — Sleep/active time endpoint: expects JSON body with `device_id` and `sleep_time` (string). The frontend uses `updateDeviceSleepTime(deviceId, sleepMinutes)` which sends `{ device_id, sleep_time: String(minutes) }`.

  Notes:

  - `updateDevice` adds the updated property as a query param on the request URL. Ensure your Laravel route accepts these params and applies the change.
  - The frontend expects the API to return `{ success: boolean, message: string, data?: any }` on success.


## Laravel Backend Setup

For detailed instructions on setting up the Laravel backend with proper CORS configuration, refer to:
[Laravel CORS Setup Guide](docs/laravel-cors-setup.md)

## Troubleshooting

### Login Issues
*   **"Invalid credentials"**: Verify that the user account exists in the Laravel backend
*   **"Connection refused"**: Ensure the Laravel API is running and accessible at the configured `NEXT_PUBLIC_API_BASE_URL`
*   **CORS errors**: Check that your Laravel backend has CORS configured correctly. See [Laravel CORS Setup](docs/laravel-cors-setup.md)

### Data Not Loading
*   **Devices page is empty**: 
    *   Verify the Laravel API `/devices` endpoint is accessible and returning data
    *   Check browser console for API errors (F12 → Console tab)
    *   Ensure the authentication token is properly stored and included in requests
*   **Location data not showing**:
    *   Verify the Laravel API has location data for the selected device
    *   Check that the device ID matches between the frontend and backend
    *   Review the `/devices/{deviceId}/locations` endpoint response

### API Connection Issues
*   **"Failed to fetch"**: Check your internet connection and ensure the Laravel API is running
*   **401 Unauthorized**: Your session may have expired. Please log out and log back in
*   **500 Server Error**: Check the Laravel backend logs for detailed error information

### Performance Issues
*   **Slow page load**: Large datasets may take time to load. Try filtering or searching for specific devices
*   **Memory issues**: Close unused browser tabs or restart the browser if performance degrades

## Project Structure

```
├── app/
│   ├── api/                 # API endpoints (placeholders)
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Home page
├── components/
│   ├── dashboard-*.tsx      # Dashboard related components
│   ├── tracking-page-*.tsx  # Tracking page components
│   ├── login-page.tsx       # Login component
│   └── ui/                  # Reusable UI components
├── lib/
│   ├── services/
│   │   └── device-api.ts    # API service layer
│   ├── types/
│   │   └── api.ts           # TypeScript API types
│   └── contexts/
│       └── auth-context.tsx # Authentication context
├── docs/
│   ├── laravel-cors-setup.md        # Backend setup guide
│   └── device-list-integration.md   # Device integration guide
└── package.json
```

## Building for Production

To build the application for production:

```bash
npm run build
npm run start
```

Or with pnpm:

```bash
pnpm build
pnpm start
```

The application will be optimized and ready for deployment.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Laravel API base URL | `http://localhost:8000` |
```