"use client"

import type React from "react"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { Head } from "@inertiajs/react"
import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { debounce } from "lodash"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  MapPin,
  Search,
  Plus,
  Edit,
  Trash2,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Locations",
    href: "/locations",
  },
]

interface Location {
  id: number
  name: string
  latitude: number
  longitude: number
  address?: string
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
  type?: string
}

// Extended fake locations data
const initialLocations: Location[] = [
  {
    id: 1,
    name: "Main Campus Library",
    latitude: 40.7128,
    longitude: -74.006,
    address: "New York, NY, USA",
  },
  {
    id: 2,
    name: "Science Building",
    latitude: 40.7589,
    longitude: -73.9851,
    address: "Manhattan, NY, USA",
  },
  {
    id: 3,
    name: "Engineering Hall",
    latitude: 40.7505,
    longitude: -73.9934,
    address: "Times Square, NY, USA",
  },
  {
    id: 4,
    name: "Student Center",
    latitude: 40.7282,
    longitude: -73.7949,
    address: "Queens, NY, USA",
  },
  {
    id: 5,
    name: "Arts & Humanities Building",
    latitude: 40.6892,
    longitude: -74.0445,
    address: "Staten Island, NY, USA",
  },
  {
    id: 6,
    name: "Sports Complex",
    latitude: 40.7831,
    longitude: -73.9712,
    address: "Central Park, NY, USA",
  },
  {
    id: 7,
    name: "Student Center",
    latitude: 40.7282,
    longitude: -73.7949,
    address: "Queens, NY, USA",
  },
  {
    id: 8,
    name: "Arts & Humanities Building",
    latitude: 40.6892,
    longitude: -74.0445,
    address: "Staten Island, NY, USA",
  },
  {
    id: 9,
    name: "Sports Complex",
    latitude: 40.7831,
    longitude: -73.9712,
    address: "Central Park, NY, USA",
  },
]

// Stable Map Component with Error Handling
const StableMap = ({
  onLocationSelect,
  selectedCoords,
  isEditing,
  editingLocation,
}: {
  onLocationSelect: (lat: number, lng: number, address?: string) => void
  selectedCoords: { lat: number; lng: number } | null
  isEditing: boolean
  editingLocation: Location | null
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Safe API call with error handling
  const safeApiCall = async (url: string): Promise<any> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "LocationPicker/1.0",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API call failed:", error)
      throw error
    }
  }

  // Initialize map with error handling
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return

    try {
      setMapError(null)

      // Dynamic import with error handling
      const L = await import("leaflet").catch(() => {
        throw new Error("Failed to load map library")
      })

      // Fix marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      })

      // Initialize map
      const initialLat = isEditing && editingLocation ? editingLocation.latitude : 40.7128
      const initialLng = isEditing && editingLocation ? editingLocation.longitude : -74.006
      const initialZoom = isEditing && editingLocation ? 15 : 2

      const map = L.map(mapRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      // Add tile layer with error handling
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      })
        .addTo(map)
        .on("tileerror", () => {
          console.warn("Some map tiles failed to load")
        })

      // Add click handler
      map.on("click", async (e: any) => {
        try {
          const { lat, lng } = e.latlng

          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current)
          }

          // Add new marker
          const marker = L.marker([lat, lng]).addTo(map)
          markerRef.current = marker

          // Try to get address, but don't fail if it doesn't work
          let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          try {
            const data = await safeApiCall(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            )
            if (data && data.display_name) {
              address = data.display_name
            }
          } catch (error) {
            console.warn("Reverse geocoding failed, using coordinates")
          }

          marker.bindPopup("Selected Location").openPopup()
          onLocationSelect(lat, lng, address)
        } catch (error) {
          console.error("Map click error:", error)
          toast.error("Failed to select location. Please try again.")
        }
      })

      mapInstanceRef.current = map

      // Add existing marker if editing
      if (isEditing && editingLocation) {
        try {
          const marker = L.marker([editingLocation.latitude, editingLocation.longitude])
            .addTo(map)
            .bindPopup(editingLocation.name)
          markerRef.current = marker
        } catch (error) {
          console.error("Failed to add existing marker:", error)
        }
      }

      setMapLoaded(true)
    } catch (error) {
      console.error("Map initialization failed:", error)
      setMapError("Failed to load map. Please refresh the page.")
      setMapLoaded(false)
    }
  }, [isEditing, editingLocation, onLocationSelect])

  // Initialize map on mount
  useEffect(() => {
    initializeMap()

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
      } catch (error) {
        console.error("Map cleanup error:", error)
      }
    }
  }, [initializeMap])

  // Update marker when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && selectedCoords) {
      try {
        const L = require("leaflet")

        // Remove existing marker
        if (markerRef.current) {
          mapInstanceRef.current.removeLayer(markerRef.current)
        }

        // Add new marker
        const marker = L.marker([selectedCoords.lat, selectedCoords.lng])
          .addTo(mapInstanceRef.current)
          .bindPopup("Selected Location")
          .openPopup()

        markerRef.current = marker
        mapInstanceRef.current.setView([selectedCoords.lat, selectedCoords.lng], 15)
      } catch (error) {
        console.error("Failed to update marker:", error)
      }
    }
  }, [selectedCoords])

  // Search functionality with error handling
  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const data = await safeApiCall(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&limit=8&addressdetails=1`,
      )

      if (Array.isArray(data)) {
        setSearchResults(data)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error("Search failed:", error)
      setSearchResults([])
      // Don't show error toast for search failures, just fail silently
    } finally {
      setIsSearching(false)
    }
  }

  const debouncedSearch = debounce(searchPlaces, 500)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    debouncedSearch(value)
  }

  const selectSearchResult = (result: SearchResult) => {
    try {
      const lat = Number.parseFloat(result.lat)
      const lng = Number.parseFloat(result.lon)

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Invalid coordinates")
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], 15)
      }

      onLocationSelect(lat, lng, result.display_name)
      setSearchQuery("")
      setSearchResults([])
    } catch (error) {
      console.error("Failed to select search result:", error)
      toast.error("Failed to select location. Please try again.")
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15)
          }

          // Try to get address
          let address = `Current Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
          try {
            const data = await safeApiCall(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            )
            if (data && data.display_name) {
              address = data.display_name
            }
          } catch (error) {
            console.warn("Failed to get address for current location")
          }

          onLocationSelect(lat, lng, address)
          toast.success("Current location detected!")
        } catch (error) {
          console.error("Failed to process current location:", error)
          toast.error("Failed to process current location.")
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        toast.error("Unable to get current location. Please check your browser permissions.")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  if (mapError) {
    return (
      <div className="w-full h-96 border rounded-lg bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 mb-4">{mapError}</p>
          <Button onClick={initializeMap} variant="outline">
            Retry Loading Map
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search anywhere in the world..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-20"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            title="Use current location"
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => selectSearchResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-sm line-clamp-1">{result.display_name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {Number.parseFloat(result.lat).toFixed(4)}, {Number.parseFloat(result.lon).toFixed(4)}
                  {result.type && <span className="ml-2 text-blue-600">• {result.type}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-4 text-center text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching...</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative">
        <div ref={mapRef} className="w-full h-96 border rounded-lg bg-gray-100" />
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span>🌍 Click anywhere on the map to select a location</span>
        </div>
        {selectedCoords && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
          </Badge>
        )}
      </div>
    </div>
  )
}

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) => {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="min-w-[2.5rem]"
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    address: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filter locations based on search term
  const filteredLocations = useMemo(() => {
    if (!searchTerm) return locations
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [locations, searchTerm])

  // Paginate filtered locations
  const paginatedLocations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredLocations.slice(startIndex, endIndex)
  }, [filteredLocations, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage)

  const handleSearch = debounce((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, 300)

  const handleLocationSelect = useCallback((lat: number, lng: number, address?: string) => {
    try {
      setSelectedCoords({ lat, lng })
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
        address: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      }))
      toast.success(`Location selected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } catch (error) {
      console.error("Failed to handle location selection:", error)
      toast.error("Failed to select location. Please try again.")
    }
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Location name is required"
    if (!formData.latitude || !formData.longitude) {
      newErrors.coordinates = "Please select a location on the map"
    }

    // Check for duplicate name
    const existingLocation = locations.find(
      (location) =>
        location.name.toLowerCase() === formData.name.toLowerCase() &&
        (!isEditing || location.id !== editingLocation?.id),
    )
    if (existingLocation) {
      newErrors.name = "Location name already exists"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      if (!validateForm()) return

      setProcessing(true)

      // Simulate API call
      setTimeout(() => {
        try {
          const lat = Number.parseFloat(formData.latitude)
          const lng = Number.parseFloat(formData.longitude)

          if (isNaN(lat) || isNaN(lng)) {
            throw new Error("Invalid coordinates")
          }

          if (isEditing && editingLocation) {
            // Update existing location
            setLocations((prev) =>
              prev.map((location) =>
                location.id === editingLocation.id
                  ? {
                      ...location,
                      name: formData.name.trim(),
                      latitude: lat,
                      longitude: lng,
                      address: formData.address,
                    }
                  : location,
              ),
            )
            toast.success("Location updated successfully.")
          } else {
            // Create new location
            const newLocation: Location = {
              id: Math.max(...locations.map((l) => l.id), 0) + 1,
              name: formData.name.trim(),
              latitude: lat,
              longitude: lng,
              address: formData.address,
            }
            setLocations((prev) => [...prev, newLocation])
            toast.success("Location created successfully.")
          }

          setIsEditing(false)
          setEditingLocation(null)
          setIsDialogOpen(false)
          resetForm()
        } catch (error) {
          console.error("Failed to save location:", error)
          toast.error("Failed to save location. Please try again.")
        } finally {
          setProcessing(false)
        }
      }, 1000)
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error("Failed to submit form. Please try again.")
      setProcessing(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      latitude: "",
      longitude: "",
      address: "",
    })
    setSelectedCoords(null)
    setErrors({})
  }

  const handleEdit = (location: Location) => {
    try {
      setIsEditing(true)
      setEditingLocation(location)
      setFormData({
        name: location.name,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        address: location.address || "",
      })
      setSelectedCoords({ lat: location.latitude, lng: location.longitude })
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Failed to edit location:", error)
      toast.error("Failed to edit location. Please try again.")
    }
  }

  const handleDelete = (locationId: number) => {
    try {
      if (confirm("Are you sure you want to delete this location?")) {
        setLocations((prev) => prev.filter((location) => location.id !== locationId))
        toast.success("Location deleted successfully.")

        // Adjust current page if necessary
        const newFilteredCount = filteredLocations.length - 1
        const newTotalPages = Math.ceil(newFilteredCount / itemsPerPage)
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages)
        }
      }
    } catch (error) {
      console.error("Failed to delete location:", error)
      toast.error("Failed to delete location. Please try again.")
    }
  }

  const handleCreateNew = () => {
    try {
      setIsEditing(false)
      setEditingLocation(null)
      resetForm()
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Failed to create new location:", error)
      toast.error("Failed to open create dialog. Please try again.")
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Locations" />

      {/* Add Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="search"
              placeholder="Search locations..."
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Location
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Location" : "Add New Location"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Main Campus Library"
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Select Location on Map</Label>
                  <StableMap
                    onLocationSelect={handleLocationSelect}
                    selectedCoords={selectedCoords}
                    isEditing={isEditing}
                    editingLocation={editingLocation}
                  />
                  {errors.coordinates && <p className="text-sm text-red-600">{errors.coordinates}</p>}
                </div>

                {selectedCoords && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Latitude</Label>
                      <Input value={formData.latitude} readOnly className="bg-gray-50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitude</Label>
                      <Input value={formData.longitude} readOnly className="bg-gray-50" />
                    </div>
                  </div>
                )}

                {formData.address && (
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={formData.address} readOnly className="bg-gray-50" />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="default" disabled={processing}>
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : isEditing ? (
                      "Update"
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedLocations.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No locations found</p>
            </div>
          ) : (
            paginatedLocations.map((location) => (
              <div key={location.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{location.name}</h3>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="line-clamp-2">{location.address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <Button onClick={() => handleEdit(location)} variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleDelete(location.id)} variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Latitude:</span>
                      <Badge variant="secondary">{location.latitude.toFixed(6)}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Longitude:</span>
                      <Badge variant="secondary">{location.longitude.toFixed(6)}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
                        window.open(url, "_blank")
                      }}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      View on Google Maps
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </AppLayout>
  )
}
