"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { LogOut, RefreshCw, AlertCircle, Train } from "lucide-react"
import { useDeviceList } from '@/hooks/use-device-list'
import { useAuth } from '@/lib/contexts/auth-context'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  onLogout: () => void
  selectedDeviceId: string
  onDeviceSelect: (deviceId: string) => void
  userId?: string // Add userId prop for API authentication
}

export function DashboardHeader({ onLogout, selectedDeviceId, onDeviceSelect, userId }: DashboardHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user } = useAuth()
  
  // Use the custom hook to fetch device list from Laravel API
  const {
    devices,
    loading: isLoadingDevices,
    error: deviceError,
    totalCount,
    retryFetch
  } = useDeviceList({ 
    userId,
    autoRefresh: false, // Disable auto-refresh to prevent unnecessary triggers
    refreshInterval: 0 // No automatic refresh
  })

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get role display name
  const getRoleDisplayName = (role: number) => {
    switch (role) {
      case 1: return 'Administrator'
      case 2: return 'User'
      case 3: return 'ESPNow Admin'
      default: return 'User'
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('auth_token')
      }
    } catch {
      // ignore storage errors
    }

    // Clear auth_token cookie
    document.cookie = 'auth_token=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'

    // Optional: Call Laravel logout endpoint to invalidate the token server-side
    // try {
    //   const token = localStorage.getItem('auth_token')
    //   if (token) {
    //     await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/logout`, {
    //       method: 'POST',
    //       headers: {
    //         'Authorization': `Bearer ${token}`,
    //         'Content-Type': 'application/json',
    //         'Accept': 'application/json'
    //       }
    //     })
    //   }
    // } catch (error) {
    //   console.warn('Logout API call failed:', error)
    // }

    // Call parent component's logout handler
    setTimeout(() => {
      onLogout()
      setIsLoggingOut(false)
    }, 300)
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Tracker Logo and Title */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-sm sm:text-lg">T</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg sm:text-xl text-foreground">Tracker</h1>
          </div>
        </div>

        {/* Device Selection Dropdown - Right aligned */}
        <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
          <div className="flex items-center space-x-2">
            {/* Device count badge - only show dsp_tracker devices count */}
            {devices.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {devices.filter(device => device.device_type?.toLowerCase() === 'dsp_tracker').length} devices
              </Badge>
            )}
          </div>
          
          <div className="w-40 sm:w-56 md:w-64 lg:w-80">
            <Select value={selectedDeviceId} onValueChange={onDeviceSelect}>
              <SelectTrigger className={cn(
                "w-full text-xs sm:text-sm transition-colors",
                deviceError && "border-red-300"
              )}>
                <SelectValue placeholder="Choose device..." />
              </SelectTrigger>
              <SelectContent className="max-h-[400px] overflow-y-auto w-full min-w-[280px] sm:min-w-[320px] md:min-w-[360px] dropdown-above-map">
                {/* Error state */}
                {deviceError && (
                  <div className="px-3 py-4 space-y-2">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Failed to load devices</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{deviceError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryFetch}
                      className="w-full h-8 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}
                
                {/* Loading state */}
                {isLoadingDevices && !deviceError && (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading devices...</span>
                    </div>
                  </div>
                )}
                
                {/* Empty state */}
                {!isLoadingDevices && !deviceError && devices.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 space-y-2">
                    <Train className="h-8 w-8 text-muted-foreground/50" />
                    <span className="text-sm text-muted-foreground">No devices found</span>
                    <p className="text-xs text-muted-foreground text-center px-4">
                      No devices are currently available
                    </p>
                  </div>
                )}
                
                {/* Device list */}
                {!isLoadingDevices && !deviceError && devices.length > 0 && (
                  <>
                    {/* Device list showing device_name (device_id) format */}
                    {devices.filter(device => device.device_type?.toLowerCase() === 'dsp_tracker').map((device) => (
                      <SelectItem 
                        key={device.device_id} 
                        value={device.device_id} 
                        className="cursor-pointer hover:bg-accent/50 focus:bg-accent/50 transition-colors"
                      >
                        <div className="py-1">
                          <span className="font-medium text-sm">
                            {device.display_name} ({device.device_id})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full p-0 transition-all duration-200 hover:scale-105 hover:shadow-lg focus:scale-105 focus:shadow-lg"
              >
                <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center shadow-md ring-2 ring-white/20 hover:ring-white/40 transition-all duration-200">
                  <span className="text-white font-bold text-xs sm:text-sm tracking-wide">
                    {user ? getUserInitials(user.name) : 'U'}
                  </span>
                  {/* Online status indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-500 ring-1 sm:ring-2 ring-white shadow-sm"></div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 sm:w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user ? getRoleDisplayName(user.role) : 'Guest'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground/70">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
