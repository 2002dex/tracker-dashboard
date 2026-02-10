"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { BarChart3, FileText, Home, Settings, MapPin, Users, X, LogOut, Navigation } from 'lucide-react'

interface DashboardSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentPage: string
  onNavigate: (page: "dashboard" | "devices" | "users" | "tracking" | "tracking-google" | "reports" | "settings") => void
  onLogout?: () => void
}

const navigation = [
  { name: "Dashboard", page: "dashboard" as const, icon: Home, description: "Overview & Analytics" },
  { name: "Devices", page: "devices" as const, icon: BarChart3, description: "Manage your devices" },
  { name: "Users", page: "users" as const, icon: Users, description: "User management" },
  { name: "Live Tracking", page: "tracking" as const, icon: MapPin, description: "OpenStreetMap tracking" },
  { name: "Google Maps", page: "tracking-google" as const, icon: Navigation, description: "Google Maps with MAC lookup" },
  { name: "Reports", page: "reports" as const, icon: FileText, description: "Analytics & Reports" },
  { name: "Settings", page: "settings" as const, icon: Settings, description: "System configuration" },
]

export function DashboardSidebar({ isOpen, onClose, currentPage, onNavigate, onLogout }: DashboardSidebarProps) {
  const handleNavClick = (page: "dashboard" | "devices" | "users" | "tracking" | "tracking-google" | "reports" | "settings") => {
    onNavigate(page)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 transform border-r bg-gradient-to-b from-background to-muted/20 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-lg md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b bg-background/95 backdrop-blur-sm md:hidden">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-foreground">Tracker Dashboard</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)] md:h-screen">
          <div className="flex flex-col h-full">
            {/* Logo Section - Desktop Only */}
            <div className="hidden md:block px-6 py-8 border-b">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-lg">T</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">Tracker</h2>
                  <p className="text-xs text-muted-foreground">Dashboard v2.0</p>
                </div>
              </div>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 px-4 py-6">
              <div className="space-y-6">
                <div>
                  <nav className="space-y-1">
                    {navigation.map((item) => {
                      const isActive = currentPage === item.page || (currentPage === "device-detail" && item.page === "devices")
                      return (
                        <div key={item.name} className="relative">
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start h-12 px-3 text-left font-medium transition-all duration-200 group",
                              isActive 
                                ? "bg-primary/10 text-primary hover:bg-primary/15 shadow-sm" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                            onClick={() => handleNavClick(item.page)}
                          >
                            <div className="flex items-center space-x-3 w-full">
                              <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                                isActive ? "bg-primary/20" : "bg-muted/50 group-hover:bg-muted"
                              )}>
                                <item.icon className={cn(
                                  "h-4 w-4",
                                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={cn(
                                  "text-sm font-medium",
                                  isActive ? "text-primary" : "text-foreground"
                                )}>{item.name}</div>
                                <div className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</div>
                              </div>
                            </div>
                          </Button>
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                          )}
                        </div>
                      )
                    })}
                  </nav>
                </div>
              </div>
            </div>

            {/* User Section */}
            <div className="p-4 border-t bg-background/50">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">JD</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">John Doe</p>
                  <p className="text-xs text-muted-foreground truncate">Administrator</p>
                </div>
                {onLogout && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onLogout}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  )
}
