"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardContent } from "@/components/dashboard-content"
import { useAuth } from "@/lib/contexts/auth-context"

// Loading fallback for Suspense
function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  )
}

// Inner component that uses useSearchParams
function DashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  
  // Initialize device ID from URL immediately
  const initialDeviceId = searchParams.get('deviceid') || ''
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(initialDeviceId)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Update URL when device selection changes
  const handleDeviceSelect = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId)
    
    // Update URL without full page reload
    if (deviceId) {
      const newUrl = `/dashboard?deviceid=${encodeURIComponent(deviceId)}`
      window.history.replaceState(null, '', newUrl)
    } else {
      window.history.replaceState(null, '', '/dashboard')
    }
  }, [])

  // Show loading state while checking authentication
  if (isLoading) {
    return <DashboardLoading />
  }

  // Should not show if not authenticated (due to redirect above)
  if (!isAuthenticated) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        onLogout={handleLogout}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={handleDeviceSelect}
        userId={user?.id.toString()}
      />
      <main>
        <DashboardContent 
          selectedDeviceId={selectedDeviceId}
          onDeviceSelect={handleDeviceSelect}
          userId={user?.id.toString()}
        />
      </main>
    </div>
  )
}

// Main export with Suspense boundary
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardInner />
    </Suspense>
  )
}
