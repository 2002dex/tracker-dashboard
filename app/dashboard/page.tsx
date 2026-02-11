"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardContent } from "@/components/dashboard-content"
import { useAuth } from "@/lib/contexts/auth-context"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Should not show if not authenticated (due to redirect above)
  if (!isAuthenticated) {
    return null
  }

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
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
