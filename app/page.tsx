"use client"

import { useState } from "react"
import { LoginPage } from "../components/login-page"
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardContent } from "../components/dashboard-content"
import { useAuth } from '@/lib/contexts/auth-context'

export default function Page() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => {}} /> // Auth context handles login now
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        onLogout={logout}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={handleDeviceSelect}
        userId={user?.id.toString()}
      />
      <main className="">
        <DashboardContent 
          selectedDeviceId={selectedDeviceId}
          onDeviceSelect={handleDeviceSelect}
          userId={user?.id.toString()}
        />
      </main>
    </div>
  )
}
