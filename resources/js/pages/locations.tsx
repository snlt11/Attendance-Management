'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import type { LatLngTuple, LeafletMouseEvent, Map, MapOptions, Marker } from 'leaflet';
import { debounce } from 'lodash';
import { AlertCircle, ChevronLeft, ChevronRight, Edit, Loader2, MapPin, Navigation, Plus, Search, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast, Toaster } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Locations',
        href: '/locations',
    },
];

interface Location {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
    created_at?: string;
}

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
    type?: string;
}

interface APIResponse<T> {
    success: boolean;
    location?: T;
    message?: string;
}

// Stable Map Component with Error Handling
const StableMap = ({
    onLocationSelect,
    selectedCoords,
    isEditing,
    editingLocation,
}: {
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    selectedCoords: { lat: number; lng: number } | null;
    isEditing: boolean;
    editingLocation: Location | null;
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);
    const markerRef = useRef<Marker | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

    // Type-safe API call with error handling
    const safeApiCall = async <T extends Record<string, any>>(url: string): Promise<T> => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'LocationPicker/1.0',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return response.json();
        } catch (err) {
            console.error('API call failed:', err);
            throw err;
        }
    };

    // Type-safe map initialization
    const initializeMap = useCallback(async () => {
        if (!mapRef.current) return;

        try {
            setMapError(null);

            const L = await import('leaflet').catch((err) => {
                console.error('Failed to load Leaflet:', err);
                throw new Error('Failed to load map library');
            });

            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            const initialLat = isEditing && editingLocation ? editingLocation.latitude : 40.7128;
            const initialLng = isEditing && editingLocation ? editingLocation.longitude : -74.006;
            const initialZoom = isEditing && editingLocation ? 15 : 2;
            const initialCenter: LatLngTuple = [initialLat, initialLng];

            const mapOptions: MapOptions = {
                center: initialCenter,
                zoom: initialZoom,
                zoomControl: true,
                scrollWheelZoom: true,
            };

            const map = L.map(mapRef.current, mapOptions);
            mapInstanceRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            } as L.TileLayerOptions)
                .addTo(map)
                .on('tileerror', () => {
                    console.warn('Some map tiles failed to load');
                });

            map.on('click', async (e: LeafletMouseEvent) => {
                try {
                    const { lat, lng } = e.latlng;

                    if (markerRef.current && mapInstanceRef.current) {
                        mapInstanceRef.current.removeLayer(markerRef.current);
                    }

                    if (mapInstanceRef.current) {
                        const marker = L.marker([lat, lng]).addTo(mapInstanceRef.current);
                        markerRef.current = marker;

                        let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                        try {
                            const data = await safeApiCall<{ display_name: string }>(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                            );
                            if (data.display_name) {
                                address = data.display_name;
                            }
                        } catch (err) {
                            console.warn('Reverse geocoding failed, using coordinates', err);
                        }

                        marker.bindPopup('Selected Location').openPopup();
                        onLocationSelect(lat, lng, address);
                    }
                } catch (err) {
                    console.error('Map click error:', err);
                    toast.error('Failed to select location. Please try again.');
                }
            });

            if (isEditing && editingLocation && mapInstanceRef.current) {
                try {
                    const marker = L.marker([editingLocation.latitude, editingLocation.longitude])
                        .addTo(mapInstanceRef.current)
                        .bindPopup(editingLocation.name);
                    markerRef.current = marker;
                } catch (err) {
                    console.error('Failed to add existing marker:', err);
                }
            }

            setMapLoaded(true);
        } catch (err) {
            console.error('Map initialization failed:', err);
            setMapError('Failed to load map. Please refresh the page.');
            setMapLoaded(false);
        }
    }, [isEditing, editingLocation, onLocationSelect]);

    // Safe cleanup with type checking
    useEffect(() => {
        initializeMap();

        return () => {
            try {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
                }
            } catch (error) {
                console.error('Map cleanup error:', error);
            }
        };
    }, [initializeMap]);

    // Type-safe marker updates
    useEffect(() => {
        if (mapInstanceRef.current && selectedCoords) {
            import('leaflet')
                .then((L) => {
                    if (markerRef.current && mapInstanceRef.current) {
                        mapInstanceRef.current.removeLayer(markerRef.current);
                    }

                    if (mapInstanceRef.current) {
                        const marker = L.marker([selectedCoords.lat, selectedCoords.lng])
                            .addTo(mapInstanceRef.current)
                            .bindPopup('Selected Location')
                            .openPopup();
                        markerRef.current = marker;
                    }
                })
                .catch((error) => {
                    console.error('Failed to update marker:', error);
                });
        }
    }, [selectedCoords]);

    // Search functionality with error handling
    // Search places type-safely
    const searchPlaces = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const data = await safeApiCall<SearchResult[]>(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`,
            );

            if (Array.isArray(data)) {
                setSearchResults(data);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const debouncedSearch = useRef(
        debounce((query: string) => {
            searchPlaces(query);
        }, 500),
    ).current;

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        debouncedSearch(value);
    };

    const selectSearchResult = (result: SearchResult) => {
        try {
            const lat = Number.parseFloat(result.lat);
            const lng = Number.parseFloat(result.lon);

            if (isNaN(lat) || isNaN(lng)) {
                throw new Error('Invalid coordinates');
            }

            if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([lat, lng], 15);
            }

            onLocationSelect(lat, lng, result.display_name);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Failed to select search result:', error);
            toast.error('Failed to select location. Please try again.');
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by this browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView([lat, lng], 15);
                    }

                    let address = `Current Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    try {
                        const data = await safeApiCall<{ display_name: string }>(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                        );
                        if (data.display_name) {
                            address = data.display_name;
                        }
                    } catch (error) {
                        console.warn('Failed to get address for current location', error);
                    }

                    onLocationSelect(lat, lng, address);
                    toast.success('Current location detected!');
                } catch (error) {
                    console.error('Failed to process current location:', error);
                    toast.error('Failed to process current location.');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                toast.error('Unable to get current location. Please check your browser permissions.');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            },
        );
    };

    if (mapError) {
        return (
            <div className="flex h-96 w-full items-center justify-center rounded-lg border bg-red-50 dark:border-gray-700 dark:bg-red-950">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
                    <p className="mb-4 text-red-700 dark:text-red-300">{mapError}</p>
                    <Button onClick={initializeMap} variant="outline">
                        Retry Loading Map
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search anywhere in the world..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                        className="pr-20 pl-10"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        className="absolute top-1/2 right-2 -translate-y-1/2 transform"
                        title="Use current location"
                    >
                        <Navigation className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="absolute top-full right-0 left-0 z-[9999] mt-1 max-h-80 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                        {searchResults.map((result, index) => (
                            <button
                                key={index}
                                onClick={() => selectSearchResult(result)}
                                className="w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                                <div className="line-clamp-1 text-sm font-medium">{result.display_name}</div>
                                <div className="mt-1 text-xs text-gray-500">
                                    {Number.parseFloat(result.lat).toFixed(4)}, {Number.parseFloat(result.lon).toFixed(4)}
                                    {result.type && <span className="ml-2 text-blue-600">• {result.type}</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {isSearching && (
                    <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border border-gray-200 bg-white p-4 text-center text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                        <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Searching...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Map Container */}
            <div className="relative">
                <div ref={mapRef} className="h-96 w-full rounded-lg border bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
                {!mapLoaded && !mapError && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                        <div className="text-center">
                            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-gray-600">Loading map...</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-gray-600 dark:border-blue-800 dark:bg-blue-950 dark:text-gray-300">
                <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>🌍 Click anywhere on the map to select a location</span>
                </div>
                {selectedCoords && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                    </Badge>
                )}
            </div>
        </div>
    );
};

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
    if (totalPages <= 1) return null;
    const pageNumbers: (number | string)[] = [];
    const siblings = 2; // how many neighbors to show on each side
    const showLeftEllipsis = currentPage > siblings + 2;
    const showRightEllipsis = currentPage < totalPages - siblings - 1;

    pageNumbers.push(1);

    if (showLeftEllipsis) pageNumbers.push('...');

    const startPage = Math.max(2, currentPage - siblings);
    const endPage = Math.min(totalPages - 1, currentPage + siblings);
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    if (showRightEllipsis) pageNumbers.push('...');

    if (totalPages > 1) pageNumbers.push(totalPages);

    // Remove duplicates and sort
    const uniquePages = Array.from(new Set(pageNumbers)).filter((p) => p === '...' || (typeof p === 'number' && p >= 1 && p <= totalPages));

    return (
        <div className="flex items-center justify-center gap-2 py-4">
            <button
                className="flex items-center gap-1 rounded-lg border px-4 py-2 text-base font-medium text-gray-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <div className="flex items-center gap-1">
                {uniquePages.map((page, idx) =>
                    page === '...' ? (
                        <span key={idx} className="px-2 text-lg text-gray-400">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            className={`h-10 w-10 rounded-lg border text-base font-medium transition-colors ${
                                page === currentPage
                                    ? 'bg-black text-white shadow dark:bg-white dark:text-black'
                                    : 'bg-white text-black hover:bg-gray-100 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800'
                            } dark:border-gray-700`}
                            onClick={() => onPageChange(Number(page))}
                            disabled={page === currentPage}
                        >
                            {page}
                        </button>
                    ),
                )}
            </div>
            <button
                className="flex items-center gap-1 rounded-lg border px-4 py-2 text-base font-medium text-gray-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

interface FormData {
    name: string;
    latitude: string;
    longitude: string;
    address: string;
}

interface LocationsPageProps {
    locations: Location[];
}

interface ErrorState {
    name?: string;
    coordinates?: string;
}

export default function Locations({ locations: initialLocations }: LocationsPageProps) {
    const [locations, setLocations] = useState<Location[]>(initialLocations);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const [formData, setFormData] = useState<FormData>({
        name: '',
        latitude: '',
        longitude: '',
        address: '',
    });

    const [errors, setErrors] = useState<ErrorState>({});

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Filter locations based on search term
    const filteredLocations = useMemo(() => {
        const searchLower = searchTerm.toLowerCase();
        return searchTerm
            ? locations.filter(
                  (location) => location.name.toLowerCase().includes(searchLower) || location.address?.toLowerCase().includes(searchLower),
              )
            : locations;
    }, [locations, searchTerm]);

    // Paginate filtered locations
    const paginatedLocations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredLocations.slice(startIndex, endIndex);
    }, [filteredLocations, currentPage]);

    const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);

    const handleSearch = debounce((value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, 300);

    const handleLocationSelect = useCallback((lat: number, lng: number, address?: string) => {
        try {
            setSelectedCoords({ lat, lng });
            setFormData((prev) => ({
                ...prev,
                latitude: lat.toFixed(6),
                longitude: lng.toFixed(6),
                address: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            }));
        } catch (error) {
            console.error('Failed to handle location selection:', error);
            toast.error('Failed to select location. Please try again.');
        }
    }, []);

    const validateForm = (): boolean => {
        const newErrors: ErrorState = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Location name is required';
        }
        if (!formData.latitude || !formData.longitude) {
            newErrors.coordinates = 'Please select a location on the map';
        }

        // Check for duplicate name
        const existingLocation = locations.find(
            (location) => location.name.toLowerCase() === formData.name.toLowerCase() && (!isEditing || location.id !== editingLocation?.id),
        );
        if (existingLocation) {
            newErrors.name = 'Location name already exists';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            if (!validateForm()) return;

            setProcessing(true);

            const lat = Number.parseFloat(formData.latitude);
            const lng = Number.parseFloat(formData.longitude);

            if (isNaN(lat) || isNaN(lng)) {
                throw new Error('Invalid coordinates');
            }

            let response;
            const payload = {
                name: formData.name.trim(),
                latitude: lat,
                longitude: lng,
                address: formData.address,
            };

            const headers = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
            };

            if (isEditing && editingLocation) {
                response = await fetch(`/locations/${editingLocation.id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload),
                });
            } else {
                response = await fetch('/locations', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                });
            }

            const data = (await response.json()) as APIResponse<Location>;
            if (!data.success) throw new Error(data.message || 'API error');

            if (isEditing && editingLocation && data.location) {
                setLocations((prev) => prev.map((location) => (location.id === editingLocation.id ? data.location! : location)));
                toast.success('Location updated successfully!');
            } else if (data.location) {
                setLocations((prev) => [data.location!, ...prev]);
                toast.success('Location created successfully!');
            }

            setIsEditing(false);
            setEditingLocation(null);
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error('Failed to save location:', error);
            toast.error('Failed to save location. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const openDeleteDialog = (location: Location) => {
        setLocationToDelete(location);
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setLocationToDelete(null);
    };

    const handleDelete = async () => {
        if (!locationToDelete) return;

        setDeletingId(locationToDelete.id);
        try {
            const response = await fetch(`/locations/${locationToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            });

            const data = (await response.json()) as APIResponse<null>;
            if (!data.success) throw new Error(data.message || 'API error');

            setLocations((prev) => prev.filter((location) => location.id !== locationToDelete.id));
            toast.success('Location deleted successfully!');
            closeDeleteDialog();
        } catch (error) {
            console.error('Failed to delete location:', error);
            toast.error('Failed to delete location. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            latitude: '',
            longitude: '',
            address: '',
        });
        setSelectedCoords(null);
        setErrors({});
    };

    const handleEdit = (location: Location) => {
        try {
            setIsEditing(true);
            setEditingLocation(location);
            setFormData({
                name: location.name,
                latitude: location.latitude.toString(),
                longitude: location.longitude.toString(),
                address: location.address || '',
            });
            setSelectedCoords({ lat: location.latitude, lng: location.longitude });
            setIsDialogOpen(true);
        } catch (error) {
            console.error('Failed to edit location:', error);
            toast.error('Failed to edit location. Please try again.');
        }
    };

    const handleCreateNew = () => {
        try {
            setIsEditing(false);
            setEditingLocation(null);
            resetForm();
            setIsDialogOpen(true);
        } catch (error) {
            console.error('Failed to create new location:', error);
            toast.error('Failed to open create dialog. Please try again.');
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

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
                <div className="flex items-center justify-between">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Search locations..."
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                            className="max-w-sm pl-10"
                        />
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default" onClick={handleCreateNew}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Location
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto" aria-describedby="location-dialog-description">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? 'Edit Location' : 'Add New Location'}</DialogTitle>
                            </DialogHeader>
                            <div id="location-dialog-description" className="sr-only">
                                {isEditing
                                    ? 'Edit an existing location by updating the details and map position.'
                                    : 'Create a new location by entering details and selecting a position on the map.'}
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                                        Location Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                                        }
                                        placeholder="e.g., Main Campus Library"
                                        className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
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
                                            <Label className="text-gray-700 dark:text-gray-300">Latitude</Label>
                                            <Input
                                                value={formData.latitude}
                                                readOnly
                                                className="bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-700 dark:text-gray-300">Longitude</Label>
                                            <Input
                                                value={formData.longitude}
                                                readOnly
                                                className="bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.address && (
                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300">Address</Label>
                                        <Input
                                            value={formData.address}
                                            readOnly
                                            className="bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 border-t pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="default" disabled={processing}>
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : isEditing ? (
                                            'Update'
                                        ) : (
                                            'Save'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedLocations.length === 0 ? (
                        <div className="col-span-full py-12 text-center">
                            <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-600" />
                            <p className="text-gray-500 dark:text-gray-400">No locations found</p>
                        </div>
                    ) : (
                        paginatedLocations.map((location: Location) => (
                            <div
                                key={location.id}
                                className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                            >
                                <div className="p-6">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{location.name}</h3>
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                    <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                                                    <span className="line-clamp-2">{location.address}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-2 flex space-x-1">
                                            <Button onClick={() => handleEdit(location)} variant="outline" size="sm" title="Edit location">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog
                                                open={deleteDialogOpen && locationToDelete?.id === location.id}
                                                onOpenChange={setDeleteDialogOpen}
                                            >
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        onClick={() => openDeleteDialog(location)}
                                                        variant="destructive"
                                                        size="sm"
                                                        title="Delete location"
                                                        disabled={deletingId === location.id}
                                                    >
                                                        {deletingId === location.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Location</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete <b>{locationToDelete?.name}</b>? This action cannot be
                                                            undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleDelete} disabled={deletingId === location.id}>
                                                            {deletingId === location.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Latitude:</span>
                                            <Badge variant="secondary" className="dark:bg-gray-800 dark:text-gray-200">
                                                {location.latitude.toFixed(6)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Longitude:</span>
                                            <Badge variant="secondary" className="dark:bg-gray-800 dark:text-gray-200">
                                                {location.longitude.toFixed(6)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t pt-4 dark:border-gray-700">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                                            onClick={() => {
                                                const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
                                                window.open(url, '_blank');
                                            }}
                                        >
                                            <MapPin className="mr-2 h-4 w-4" />
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
            <Toaster position="top-right" richColors />
        </AppLayout>
    );
}
