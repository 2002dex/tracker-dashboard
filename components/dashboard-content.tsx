"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MapPin, Loader2, Satellite, Clock, Route, Settings, Save, Users, Copy, Check, Filter, Calendar } from 'lucide-react'
import { deviceApi } from '@/lib/services/device-api'
import { ProcessedGPSLocation, ProcessedMACLocation, DeviceDetailsResponse, SleepTimeSyncStatus } from '@/lib/types/api'
import { useDeviceList } from '@/hooks/use-device-list'
import { toast } from '@/hooks/use-toast'

// Filter types
type FilterType = 'last10' | 'last20' | 'last50' | 'custom' | 'date'

interface DashboardContentProps {
  selectedDeviceId: string
  onDeviceSelect: (deviceId: string) => void
  userId?: string
}

// Leaflet types
declare global {
  interface Window {
    L: any
  }
}

export function DashboardContent({ selectedDeviceId, onDeviceSelect, userId }: DashboardContentProps) {
  const { 
    devices: apiDevices, 
    rawDevices,
    loading: isLoadingDevices, 
    error: deviceError,
    refreshDevices,
    getDeviceSleepTime,
    getDeviceStatus
  } = useDeviceList({ userId, autoRefresh: false })
  
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [gpsLocations, setGpsLocations] = useState<ProcessedGPSLocation[]>([])
  const [macLocations, setMacLocations] = useState<ProcessedMACLocation[]>([])
  
  /// Active time settings state (stored in minutes)
  const [activeTime, setActiveTime] = useState<number>(10)
  const [newActiveTime, setNewActiveTime] = useState<string>('') // HH:MM format
  // Per-device active time map (minutes) so switching devices restores their own value
  const [deviceActiveTimes, setDeviceActiveTimes] = useState<Record<string, number>>({})
  
  
  // Sleep time sync status: determined by device status field
  const [sleepTimeSyncStatus, setSleepTimeSyncStatus] = useState<SleepTimeSyncStatus>('idle')
  // Expected sleep_time value after update (in seconds)
  const [pendingSleepTime, setPendingSleepTime] = useState<number | null>(null)
  const [isEditingActiveTime, setIsEditingActiveTime] = useState(false)
  const [isSavingActiveTime, setIsSavingActiveTime] = useState(false)
  
  // Device name editing
  const [newDeviceName, setNewDeviceName] = useState<string>('')
  const [isEditingDeviceName, setIsEditingDeviceName] = useState(false)
  const [isSavingDeviceName, setIsSavingDeviceName] = useState(false)
  
  // Leaflet map refs
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylineRef = useRef<any>(null)
  const leafletLoadedRef = useRef(false)

  // Filter state
  const [filterType, setFilterType] = useState<FilterType>('last10')
  const [customCount, setCustomCount] = useState<number>(10)
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  // State for device details and last active time
  const [deviceDetails, setDeviceDetails] = useState<DeviceDetailsResponse | null>(null)
  const [lastActiveTime, setLastActiveTime] = useState<string | null>(null)

  // Filter locations based on filter type
  const filteredLocations = useMemo(() => {
    let filteredGPS = [...gpsLocations]
    let filteredMAC = [...macLocations]

    filteredGPS.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    filteredMAC.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    if (filterType === 'date' && (dateFrom || dateTo)) {
      const fromDate = dateFrom ? new Date(dateFrom).getTime() : 0
      const toDate = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : Date.now()

      filteredGPS = filteredGPS.filter(loc => {
        const locTime = new Date(loc.timestamp).getTime()
        return locTime >= fromDate && locTime <= toDate
      })
      filteredMAC = filteredMAC.filter(loc => {
        const locTime = new Date(loc.timestamp).getTime()
        return locTime >= fromDate && locTime <= toDate
      })
    } else {
      let limit = 10
      if (filterType === 'last20') limit = 20
      else if (filterType === 'last50') limit = 50
      else if (filterType === 'custom') limit = customCount

      const allLocations = [
        ...filteredGPS.map(loc => ({ ...loc, type: 'gps' as const })),
        ...filteredMAC.map(loc => ({ ...loc, type: 'mac' as const }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      const limitedLocations = allLocations.slice(0, limit)
      filteredGPS = limitedLocations.filter(loc => loc.type === 'gps') as ProcessedGPSLocation[]
      filteredMAC = limitedLocations.filter(loc => loc.type === 'mac') as ProcessedMACLocation[]
    }

    return { gps: filteredGPS, mac: filteredMAC }
  }, [gpsLocations, macLocations, filterType, customCount, dateFrom, dateTo])

  // Fetch GPS locations from Laravel API for selected device
  const fetchDeviceLocations = useCallback(async (deviceId: string) => {
    if (!deviceId) {
      setGpsLocations([])
      setMacLocations([])
      setDeviceDetails(null)
      setLastActiveTime(null)
      return
    }

    setIsLoadingLocations(true)
    setError(null)
    
    try {
      const deviceDetailsResponse = await deviceApi.fetchDeviceDetails(deviceId)
      
      if (deviceDetailsResponse.success && deviceDetailsResponse.data) {
        setDeviceDetails(deviceDetailsResponse)
        const gpsLocs = deviceApi.extractGPSLocations(deviceDetailsResponse)
        setGpsLocations(gpsLocs)
        const macLocs = deviceApi.extractMACLocations(deviceDetailsResponse)
        setMacLocations(macLocs)
        const mostRecentTime = deviceApi.getLastActiveTime(deviceDetailsResponse)
        setLastActiveTime(mostRecentTime)
      } else {
        throw new Error(deviceDetailsResponse.message || 'Failed to fetch device details')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch device locations')
      setGpsLocations([])
      setMacLocations([])
      setDeviceDetails(null)
      setLastActiveTime(null)
    } finally {
      setIsLoadingLocations(false)
    }
  }, [])

  // Load Leaflet CSS and JS
  const loadLeaflet = useCallback(() => {
    if (leafletLoadedRef.current) {
      if (window.L && (window.L as any).Control?.FullScreen) setMapLoaded(true)
      return
    }
    if (window.L && (window.L as any).Control?.FullScreen) {
      leafletLoadedRef.current = true
      setMapLoaded(true)
      return
    }

    leafletLoadedRef.current = true

    if (!document.querySelector('link[href*="leaflet@1.9.4/dist/leaflet.css"]')) {
      const cssLink = document.createElement('link')
      cssLink.rel = 'stylesheet'
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      cssLink.crossOrigin = ''
      document.head.appendChild(cssLink)
    }

    if (!document.querySelector('link[href*="Control.FullScreen.css"]')) {
      const fsCssLink = document.createElement('link')
      fsCssLink.rel = 'stylesheet'
      fsCssLink.href = '/leaflet-fullscreen/Control.FullScreen.css'
      document.head.appendChild(fsCssLink)
    }

    if (!document.querySelector('script[src*="leaflet@1.9.4/dist/leaflet.js"]')) {
      const leafletScript = document.createElement('script')
      leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      leafletScript.crossOrigin = ''
      leafletScript.onload = () => {
        if (!document.querySelector('script[src*="Control.FullScreen.js"]')) {
          const fsScript = document.createElement('script')
          fsScript.src = '/leaflet-fullscreen/Control.FullScreen.js'
          fsScript.onload = () => setMapLoaded(true)
          fsScript.onerror = () => setError('Failed to load fullscreen control.')
          document.body.appendChild(fsScript)
        } else {
          setMapLoaded(true)
        }
      }
      leafletScript.onerror = () => setError('Failed to load map libraries.')
      document.head.appendChild(leafletScript)
    } else if (window.L) {
      if (!document.querySelector('script[src*="Control.FullScreen.js"]')) {
        const fsScript = document.createElement('script')
        fsScript.src = '/leaflet-fullscreen/Control.FullScreen.js'
        fsScript.onload = () => setMapLoaded(true)
        document.body.appendChild(fsScript)
      } else {
        setMapLoaded(true)
      }
    }
  }, [])

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return

    try {
      const map = window.L.map(mapRef.current, {
        preferCanvas: true,
        attributionControl: true,
        zoomControl: true,
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topleft' },
      }).setView([20.5937, 78.9629], 6)

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map)

      mapInstanceRef.current = map
      setTimeout(() => { mapInstanceRef.current?.invalidateSize(true) }, 100)
    } catch {
      setError('Failed to initialize map.')
    }
  }, [mapLoaded])

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => { if (marker.remove) marker.remove() })
    markersRef.current = []
    if (polylineRef.current && polylineRef.current.remove) {
      polylineRef.current.remove()
      polylineRef.current = null
    }
  }, [])

  const addAllLocationsToMap = useCallback((gpsLocs: ProcessedGPSLocation[], macLocs: ProcessedMACLocation[]) => {
    if (!mapInstanceRef.current || !mapLoaded || !window.L) return
    clearMarkers()
    if (gpsLocs.length === 0 && macLocs.length === 0) return

    try {
      const sortedGPS = [...gpsLocs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      const sortedMAC = [...macLocs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      const validGPS = sortedGPS.filter(loc => typeof loc.latitude === 'number' && typeof loc.longitude === 'number' && !Number.isNaN(loc.latitude) && !Number.isNaN(loc.longitude))
      const validMAC = sortedMAC.filter(loc => typeof loc.latitude === 'number' && typeof loc.longitude === 'number' && !Number.isNaN(loc.latitude) && !Number.isNaN(loc.longitude))

      if (validGPS.length === 0 && validMAC.length === 0) return

      const bounds = window.L.latLngBounds([])

      if (validGPS.length > 1) {
        const routeCoords = validGPS.map(loc => [loc.latitude, loc.longitude])
        const polyline = window.L.polyline(routeCoords, { color: '#3b82f6', weight: 3, opacity: 0.8 })
        if (polyline?.addTo && mapInstanceRef.current) {
          polyline.addTo(mapInstanceRef.current)
          polylineRef.current = polyline
        }
      }

      validMAC.forEach((location, index) => {
        try {
          if (location.accuracy && location.accuracy > 0) {
            const circle = window.L.circle([location.latitude, location.longitude], {
              radius: location.accuracy, color: '#f97316', fillColor: '#fed7aa', fillOpacity: 0.2, weight: 1, opacity: 0.4
            })
            if (circle?.addTo) { circle.addTo(mapInstanceRef.current); markersRef.current.push(circle) }
          }
          const marker = window.L.circleMarker([location.latitude, location.longitude], {
            color: '#ffffff', fillColor: '#f97316', fillOpacity: 1, weight: 2, radius: 6
          })
          if (marker?.addTo && mapInstanceRef.current) {
            marker.addTo(mapInstanceRef.current)
            marker.bindPopup(`<div class="p-2 min-w-[200px]"><h3 class="font-semibold text-sm mb-2">MAC Location ${index + 1}</h3><p class="text-xs text-gray-600 mb-1"><strong>Time:</strong> ${new Date(location.timestamp).toLocaleString()}</p><p class="text-xs text-gray-600 mb-1"><strong>Coordinates:</strong> ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</p><p class="text-xs text-gray-600 mb-1"><strong>MAC:</strong> ${location.mac_address}</p>${location.accuracy ? `<p class="text-xs text-gray-600"><strong>Accuracy:</strong> ±${location.accuracy}m</p>` : ''}</div>`)
            marker.on('mouseover', () => { marker.openPopup() })
            markersRef.current.push(marker)
            bounds.extend([location.latitude, location.longitude])
          }
        } catch { /* skip */ }
      })

      validGPS.forEach((location, index) => {
        try {
          const marker = window.L.circleMarker([location.latitude, location.longitude], {
            color: '#ffffff', fillColor: '#3b82f6', fillOpacity: 1, weight: 2, radius: 8, zIndexOffset: 1000
          })
          if (marker?.addTo && mapInstanceRef.current) {
            marker.addTo(mapInstanceRef.current)
            marker.bindPopup(`<div class="p-2 min-w-[200px]"><h3 class="font-semibold text-sm mb-2">GPS Point ${index + 1}</h3><p class="text-xs text-gray-600 mb-1"><strong>Time:</strong> ${new Date(location.timestamp).toLocaleString()}</p><p class="text-xs text-gray-600 mb-1"><strong>Coordinates:</strong> ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</p>${location.speed ? `<p class="text-xs text-gray-600 mb-1"><strong>Speed:</strong> ${location.speed}</p>` : ''}${location.altitude ? `<p class="text-xs text-gray-600"><strong>Altitude:</strong> ${location.altitude}</p>` : ''}</div>`)
            marker.on('mouseover', () => { marker.openPopup(); marker.setStyle({ radius: 10, weight: 3 }) })
            marker.on('mouseout', () => { marker.setStyle({ radius: 8, weight: 2 }) })
            markersRef.current.push(marker)
            bounds.extend([location.latitude, location.longitude])
          }
        } catch { /* skip */ }
      })

      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 })
      } else {
        mapInstanceRef.current.setView([20.5937, 78.9629], 6)
      }
    } catch {
      setError('Failed to add locations to map.')
    }
  }, [mapLoaded, clearMarkers])

  useEffect(() => { loadLeaflet() }, [loadLeaflet])

  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      const timer = setTimeout(() => initializeMap(), 100)
      return () => clearTimeout(timer)
    }
  }, [mapLoaded, initializeMap])

  useEffect(() => {
    if (selectedDeviceId && mapLoaded && mapRef.current) {
      if (!mapInstanceRef.current) {
        const timer = setTimeout(() => initializeMap(), 300)
        return () => clearTimeout(timer)
      } else {
        const timer = setTimeout(() => { mapInstanceRef.current?.invalidateSize(true) }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [selectedDeviceId, mapLoaded, initializeMap])

  useEffect(() => {
    if (selectedDeviceId) {
      fetchDeviceLocations(selectedDeviceId)
    } else {
      clearMarkers()
      setGpsLocations([])
      setMacLocations([])
    }
  }, [selectedDeviceId, fetchDeviceLocations, clearMarkers])

  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current) {
      if (filteredLocations.gps.length > 0 || filteredLocations.mac.length > 0) {
        mapInstanceRef.current.invalidateSize(true)
        setTimeout(() => addAllLocationsToMap(filteredLocations.gps, filteredLocations.mac), 100)
      } else {
        clearMarkers()
      }
    }
  }, [filteredLocations, mapLoaded, addAllLocationsToMap, clearMarkers])

  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) setTimeout(() => mapInstanceRef.current.invalidateSize(true), 100)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Utility: convert minutes to HH:MM
  const formatMinutesToHHMM = useCallback((minutes: number): string => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  }, [])

  // Utility: parse HH:MM to minutes (returns null if invalid)
  const parseHHMMToMinutes = useCallback((value: string): number | null => {
    const trimmed = value.trim()
    const match = trimmed.match(/^([0-9]{1,2}):([0-9]{2})$/)
    if (!match) return null

    const hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)

    if (isNaN(hours) || isNaN(minutes) || minutes < 0 || minutes >= 60) {
      return null
    }

    return hours * 60 + minutes
  }, [])

  // Determine sync status from device status field
  // status=1 → green (idle), status=0 → yellow (pending)
  const getDeviceSyncStatus = useCallback((): SleepTimeSyncStatus => {
    if (!selectedDeviceId) return 'idle'
    const status = getDeviceStatus(selectedDeviceId)
    if (status === null) return sleepTimeSyncStatus // fallback to local state
    if (status === 1) return 'idle' // green - device acknowledged
    if (status === 0) return 'pending' // yellow - pending
    return 'idle'
  }, [selectedDeviceId, getDeviceStatus, sleepTimeSyncStatus])

  const currentSyncStatus = getDeviceSyncStatus()

  // Handle active time save
  const handleSaveActiveTime = useCallback(async () => {
    if (!selectedDeviceId || !newActiveTime.trim()) return

    setIsSavingActiveTime(true)
    setError(null)

    try {
      const totalMinutes = parseHHMMToMinutes(newActiveTime)

      if (totalMinutes === null || totalMinutes <= 0) {
        throw new Error('Please enter a valid time in HH:MM format (e.g., 00:10, 01:30)')
      }

      if (totalMinutes > 255) {
        throw new Error('Maximum allowed active time is 04:15 (255 minutes)')
      }

      const result = await deviceApi.updateDeviceSleepTime(selectedDeviceId, totalMinutes)

      if (!result.success) {
        throw new Error(result.message || 'Failed to update active time')
      }

      // After update, status should become 0 (pending/yellow)
      setSleepTimeSyncStatus('pending')
      setPendingSleepTime(totalMinutes)
      setActiveTime(totalMinutes)
      setIsEditingActiveTime(false)

      toast({
        title: 'Update initiated',
        description: 'Active time update sent to device. Status: Pending.',
      })

      // Refresh device list to get updated status
      await refreshDevices()

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save active time'
      setError(message)
      setSleepTimeSyncStatus('failed')
      toast({
        title: 'Failed to update active time',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSavingActiveTime(false)
    }
  }, [selectedDeviceId, newActiveTime, parseHHMMToMinutes, toast, deviceApi])

  // Restore per-device active time when switching devices
  useEffect(() => {
    if (!selectedDeviceId) return

    // Get sleep_time from device-list API (now in seconds)
    const apiSleepTime = getDeviceSleepTime(selectedDeviceId)
    if (apiSleepTime !== null) {
      setActiveTime(apiSleepTime)
      setNewActiveTime(formatMinutesToHHMM(apiSleepTime))
    } else {
      setActiveTime(10) // default 10 minutes
      setNewActiveTime(formatMinutesToHHMM(10))
    }

    // Determine sync status from device status field
    const status = getDeviceStatus(selectedDeviceId)
    if (status === 0) {
      setSleepTimeSyncStatus('pending')
    } else {
      setSleepTimeSyncStatus('idle')
    }
    
    setIsEditingActiveTime(false)
    setIsSavingActiveTime(false)
    setPendingSleepTime(null)
  }, [selectedDeviceId, getDeviceSleepTime, getDeviceStatus, formatMinutesToHHMM])

  // Handle device name save
  const handleSaveDeviceName = useCallback(async () => {
    if (!selectedDeviceId || !newDeviceName.trim()) return

    setIsSavingDeviceName(true)
    setError(null)

    try {
      const result = await deviceApi.updateDeviceTag(selectedDeviceId, newDeviceName)
      
      if (result.success) {
        await refreshDevices()
        // Notify other components (e.g., header) to refresh their device lists
        try {
          window.dispatchEvent(new Event('deviceListRefresh'))
        } catch {
          // ignore in non-browser environments
        }
        toast({ title: 'Success', description: result.message })
        setIsEditingDeviceName(false)
        setNewDeviceName('')
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' })
        setError(result.message)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save device name'
      setError(errorMessage)
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSavingDeviceName(false)
    }
  }, [selectedDeviceId, newDeviceName, refreshDevices])

  // Handle device ID copy
  const [copiedDeviceId, setCopiedDeviceId] = useState(false)
  const handleCopyDeviceId = useCallback(async (deviceId: string) => {
    try {
      await navigator.clipboard.writeText(deviceId)
      setCopiedDeviceId(true)
      setTimeout(() => setCopiedDeviceId(false), 2000)
    } catch (error) {
      console.error('Failed to copy device ID:', error)
    }
  }, [])

  const selectedDevice = apiDevices.find(d => d.device_id === selectedDeviceId)

  return (
    <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
      {/* Device Details Section */}
      {selectedDevice ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Satellite className="h-5 w-5" />
                  Device Information & Settings
                </CardTitle>
                <CardDescription>
                  Manage device details and configuration settings
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Device Settings</DialogTitle>
                    <DialogDescription>
                      Manage device name and active time settings
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="device-name">Rename Device</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="device-name"
                          value={newDeviceName}
                          onChange={(e) => setNewDeviceName(e.target.value)}
                          placeholder={selectedDevice.display_name}
                        />
                        <Button
                          onClick={handleSaveDeviceName}
                          disabled={isSavingDeviceName || !newDeviceName.trim()}
                        >
                          {isSavingDeviceName ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <Label htmlFor="active-time">Active Time (HH:MM)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="active-time"
                          type="time"
                          step={60}
                          value={newActiveTime}
                          onChange={(e) => setNewActiveTime(e.target.value)}
                          placeholder={formatMinutesToHHMM(activeTime)}
                        />
                        <Button
                          onClick={handleSaveActiveTime}
                          disabled={isSavingActiveTime || !newActiveTime.trim()}
                        >
                          {isSavingActiveTime ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Device Details */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Device Name</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">{selectedDevice.display_name}</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-muted"
                        onClick={() => handleCopyDeviceId(selectedDevice.device_id)}
                        title={copiedDeviceId ? "Copied!" : "Copy Device ID"}
                      >
                        {copiedDeviceId ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Seen</Label>
                  <p className="text-sm">
                    {lastActiveTime 
                      ? new Date(lastActiveTime).toLocaleString()
                      : (gpsLocations.length > 0 
                          ? new Date(gpsLocations[0].timestamp).toLocaleString()
                          : 'No recent activity')}
                  </p>
                  {lastActiveTime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Most recent activity from GPS or MAC data
                    </p>
                  )}
                </div>
              </div>

              {/* Current Active Time Display */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Active Time Configuration</Label>
                  <div className={`flex items-center gap-2 p-3 rounded-lg mt-2 ${
                    currentSyncStatus === 'pending' 
                      ? 'bg-yellow-50 border border-yellow-200' 
                      : currentSyncStatus === 'idle'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-muted/50'
                  }`}>
                    <Clock className={`h-4 w-4 ${
                      currentSyncStatus === 'pending' ? 'text-yellow-600' : 
                      currentSyncStatus === 'idle' ? 'text-green-600' : 'text-muted-foreground'
                    }`} />
                    <span className="text-sm font-medium">
                      Current: {formatMinutesToHHMM(activeTime)} (HH:MM)
                    </span>
                    {/* Sync status indicator based on device status field */}
                    {currentSyncStatus === 'pending' && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {currentSyncStatus === 'idle' && (
                      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                    {currentSyncStatus === 'failed' && (
                      <Badge variant="destructive" className="text-xs">
                        Failed
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {currentSyncStatus === 'pending' 
                      ? 'Update sent to device, waiting for confirmation...'
                      : currentSyncStatus === 'idle'
                      ? 'Device has confirmed the active time'
                      : `Device will send location updates every ${formatMinutesToHHMM(activeTime)} when active`}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Location Statistics</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">GPS Points</span>
                      <Badge variant="outline" className="text-blue-600">
                        {gpsLocations.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">MAC Locations</span>
                      <Badge variant="outline" className="text-orange-600">
                        {macLocations.length}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Welcome to Tracker Dashboard
            </CardTitle>
            <CardDescription>
              Select a device from the dropdown above to view its details and track its location
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Satellite className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Device Selected</h3>
            <p className="text-muted-foreground">
              Choose a device from the header dropdown to view live tracking, manage settings, and see detailed information.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Map Display */}
      <Card className={selectedDevice ? "" : "hidden"}>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Live Route Visualization
                {isLoadingLocations && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>GPS ({filteredLocations.gps.length})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>MAC ({filteredLocations.mac.length})</span>
                </div>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Filter:</Label>
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last10">Last 10</SelectItem>
                  <SelectItem value="last20">Last 20</SelectItem>
                  <SelectItem value="last50">Last 50</SelectItem>
                  <SelectItem value="custom">Custom Count</SelectItem>
                  <SelectItem value="date">Date Range</SelectItem>
                </SelectContent>
              </Select>
              
              {filterType === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={customCount}
                    onChange={(e) => setCustomCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
                    className="w-20 h-8"
                    placeholder="Count"
                  />
                  <span className="text-xs text-muted-foreground">locations</span>
                </div>
              )}
              
              {filterType === 'date' && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-xs">From:</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-[150px] h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">To:</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-[150px] h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          <div className="relative">
            <div
              ref={mapRef}
              className="w-full h-[400px] sm:h-[500px] bg-gray-200 rounded-lg overflow-hidden border"
            >
              {!mapLoaded && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading OpenStreetMap...</p>
                  </div>
                </div>
              )}
            </div>
            
            {selectedDeviceId && filteredLocations.gps.length === 0 && filteredLocations.mac.length === 0 && !isLoadingLocations && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Location Data</h3>
                  <p className="text-muted-foreground">
                    This device has no GPS or MAC location records from the latest data.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
