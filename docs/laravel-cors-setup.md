# Laravel CORS Configuration for Next.js Integration

## Overview
To allow your Next.js application (running on `http://localhost:3000`) to communicate with your Laravel API (running on `http://127.0.0.1:8000`), you need to configure CORS (Cross-Origin Resource Sharing) in Laravel.

## Quick Fix - Option 1: Using Laravel CORS Package

### Step 1: Install Laravel CORS Package (if not already installed)
```bash
composer require fruitcake/laravel-cors
```

### Step 2: Publish CORS Configuration
```bash
php artisan vendor:publish --tag="cors"
```

### Step 3: Configure CORS Settings
Edit `config/cors.php`:

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001', // If you use different ports
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false, // Set to false to avoid wildcard issues
];
```

### Step 4: Add CORS Middleware to API Routes
In `app/Http/Kernel.php`, ensure the CORS middleware is applied to API routes:

```php
protected $middlewareGroups = [
    'api' => [
        \Fruitcake\Cors\HandleCors::class,
        'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];
```

## Quick Fix - Option 2: Manual CORS Headers

If you prefer not to use the CORS package, add CORS headers manually to your API responses.

### Create a CORS Middleware
```bash
php artisan make:middleware CorsMiddleware
```

### Edit `app/Http/Middleware/CorsMiddleware.php`:
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Handle preflight OPTIONS requests
        if ($request->getMethod() === "OPTIONS") {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', 'http://localhost:3000')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
        }

        $response = $next($request);

        // Add CORS headers to actual requests
        return $response
            ->header('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
    }
}
```

### Register the Middleware
In `app/Http/Kernel.php`, add to the API middleware group:

```php
protected $middlewareGroups = [
    'api' => [
        \App\Http\Middleware\CorsMiddleware::class,
        'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];
```

## Quick Fix - Option 3: Direct Route CORS (Simplest)

Add CORS headers directly to your device API controller methods.

### Update DeviceAPIController
Add this method to your `app/Http/Controllers/Api/DeviceAPIController.php`:

```php
/**
 * Add CORS headers to response
 */
private function addCorsHeaders($response)
{
    return $response
        ->header('Access-Control-Allow-Origin', 'http://localhost:3000')
        ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');
}
```

Then update your `getDeviceList` method to use it:

```php
public function getDeviceList(Request $request)
{
    // ... existing code ...

    $response = response()->json([
        'success' => true,
        'message' => 'Device list retrieved successfully',
        'data' => [
            'devices' => $deviceList,
            'total_count' => count($deviceList),
            'user_role' => $user->role,
            'timestamp' => Carbon::now()->toISOString(),
        ],
    ], 200);

    return $this->addCorsHeaders($response);
}
```

Also add an OPTIONS route to handle preflight requests in `routes/api.php`:

```php
// Handle OPTIONS preflight requests
Route::options('/device-list', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', 'http://localhost:3000')
        ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');
});
```

## Recommended Solution (Option 1)

I recommend using **Option 1** (Laravel CORS package) as it's the most robust and widely used solution.

### Complete Steps for Option 1:

1. **Install the package** (run in your Laravel project directory):
   ```bash
   cd "C:\xampp\htdocs\pcat-dashboard"
   composer require fruitcake/laravel-cors
   ```

2. **Publish configuration**:
   ```bash
   php artisan vendor:publish --tag="cors"
   ```

3. **Update `config/cors.php`**:
   ```php
   return [
       'paths' => ['api/*'],
       'allowed_methods' => ['*'],
       'allowed_origins' => ['http://localhost:3000', 'http://127.0.0.1:3000'],
       'allowed_headers' => ['*'],
       'supports_credentials' => false,
   ];
   ```

4. **Clear config cache**:
   ```bash
   php artisan config:clear
   ```

## Testing CORS Fix

After implementing any of the above solutions:

1. **Restart Laravel Server**:
   ```bash
   php artisan serve
   ```

2. **Test the API endpoint directly**:
   ```bash
   curl -H "Accept: application/json" "http://127.0.0.1:8000/api/device-list?user_id=1"
   ```

3. **Check Browser Network Tab**:
   - Open browser developer tools
   - Go to Network tab
   - Reload Next.js page
   - Check if CORS errors are resolved

## Alternative: Development Proxy

If CORS continues to be an issue, you can use Next.js rewrites as a proxy in development.

### Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/laravel-api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

### Update API Service Base URL:
```typescript
// In development, use the proxy
const baseUrl = process.env.NODE_ENV === 'development' 
  ? '/laravel-api' 
  : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
```

## Verification

After implementing the CORS fix, you should see:
- ✅ No CORS errors in browser console
- ✅ Device list loads in the dropdown
- ✅ API calls complete successfully
- ✅ Proper error handling for API issues

## Common CORS Error Messages

### Error: "blocked by CORS policy"
- **Solution**: Implement one of the CORS fixes above

### Error: "credentials mode is 'include'"
- **Solution**: Set `supports_credentials: false` in CORS config

### Error: "wildcard '*' when request's credentials mode is 'include'"
- **Solution**: Remove `credentials: 'include'` from fetch or set specific origins

## Production Considerations

For production deployment:

1. **Update allowed origins** to include your production domain
2. **Enable HTTPS** for secure communication
3. **Consider API rate limiting** to prevent abuse
4. **Use environment variables** for origin configuration

### Production CORS Config:
```php
'allowed_origins' => [
    env('FRONTEND_URL', 'https://yourdomain.com'),
    'http://localhost:3000', // Keep for development
],
```
