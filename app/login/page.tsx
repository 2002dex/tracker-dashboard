"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginPage } from "@/components/login-page"
import { useAuth } from "@/lib/contexts/auth-context"

export default function LoginPageRoute() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <LoginPage onLogin={() => router.push('/dashboard')} />
}
