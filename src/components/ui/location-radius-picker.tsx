'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { GoogleMap, useJsApiLoader, Circle, Marker } from '@react-google-maps/api';
import { Slider } from './slider';
import { Button } from './button';

interface Coords {
  lat: number;
  lng: number;
}

interface LocationInfo {
  country?: string;
  countryCode?: string;
  city?: string;
}

interface LocationRadiusPickerProps {
  radius: number;
  onRadiusChange: (radius: number) => void;
  coords?: Coords | null;
  onCoordsChange?: (coords: Coords) => void;
  onLocationInfoChange?: (info: LocationInfo) => void;
  minRadius?: number;
  maxRadius?: number;
  className?: string;
  autoRequestLocation?: boolean;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Default center (Mexico City)
const DEFAULT_CENTER: Coords = {
  lat: 19.4326,
  lng: -99.1332,
};

const mapContainerStyle = {
  width: '100%',
  height: '280px',
  borderRadius: '16px',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export function LocationRadiusPicker({
  radius,
  onRadiusChange,
  coords,
  onCoordsChange,
  onLocationInfoChange,
  minRadius = 1,
  maxRadius = 200,
  className = '',
  autoRequestLocation = true,
}: LocationRadiusPickerProps) {
  const t = useTranslations('location');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const hasRequestedLocation = useRef(false);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Initialize geocoder when maps is loaded
  useEffect(() => {
    if (isLoaded && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [isLoaded]);

  // Reverse geocode to get country and city
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    try {
      const response = await geocoderRef.current.geocode({
        location: { lat, lng },
      });

      if (response.results && response.results.length > 0) {
        let country = '';
        let countryCode = '';
        let city = '';

        // Find country and city from address components
        for (const result of response.results) {
          for (const component of result.address_components) {
            if (component.types.includes('country')) {
              country = component.long_name;
              countryCode = component.short_name;
            }
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (!city && component.types.includes('administrative_area_level_1')) {
              city = component.long_name;
            }
          }
          // Break if we have both
          if (country && city) break;
        }

        const info: LocationInfo = { country, countryCode, city };
        setLocationInfo(info);
        onLocationInfoChange?.(info);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }, [onLocationInfoChange]);

  const center = coords || DEFAULT_CENTER;
  const hasLocation = !!coords;

  // Calculate zoom level based on radius (defined first as it's used by other functions)
  const getZoomLevel = useCallback((radiusKm: number): number => {
    // Approximate zoom levels for different radius values
    if (radiusKm <= 5) return 12;
    if (radiusKm <= 10) return 11;
    if (radiusKm <= 25) return 10;
    if (radiusKm <= 50) return 9;
    if (radiusKm <= 100) return 8;
    return 7;
  }, []);

  // Request location function
  const requestLocationImmediately = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        onCoordsChange?.(newCoords);
        setIsLocating(false);
        hasRequestedLocation.current = true;
        
        // Pan map to new location if map is ready
        if (map) {
          map.panTo(newCoords);
          map.setZoom(getZoomLevel(radius));
        }

        // Reverse geocode to get country and city
        reverseGeocode(newCoords.lat, newCoords.lng);
      },
      (error) => {
        setIsLocating(false);
        hasRequestedLocation.current = true;
        // Update permission state if denied
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
          setLocationError(t('errors.permissionDenied'));
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError(t('errors.unavailable'));
        } else if (error.code === error.TIMEOUT) {
          setLocationError(t('errors.timeout'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }, [onCoordsChange, map, radius, t, getZoomLevel, reverseGeocode]);

  // Check permission state on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionState(result.state);
        
        // Listen for permission changes
        result.onchange = () => {
          setPermissionState(result.state);
          // If permission was just granted and we don't have coords, request location
          if (result.state === 'granted' && !coords && !hasRequestedLocation.current) {
            requestLocationImmediately();
          }
        };
      }).catch(() => {
        // Permissions API not supported, that's ok
      });
    }
  }, [coords, requestLocationImmediately]);

  // Auto-request location when autoRequestLocation is true and we don't have coords
  useEffect(() => {
    if (!autoRequestLocation || coords || hasRequestedLocation.current) return;
    if (permissionState === 'denied') return;

    // Small delay to ensure component is mounted
    const timer = setTimeout(() => {
      requestLocationImmediately();
    }, 300);

    return () => clearTimeout(timer);
  }, [autoRequestLocation, coords, permissionState, requestLocationImmediately]);

  // Circle options
  const circleOptions = useMemo(
    () => ({
      strokeColor: '#FF6F61',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF6F61',
      fillOpacity: 0.15,
      clickable: false,
      draggable: false,
      editable: false,
      visible: true,
      radius: radius * 1000, // Convert km to meters
      zIndex: 1,
    }),
    [radius]
  );

  // Request user's location (wrapper for button click)
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(t('errors.notSupported'));
      return;
    }
    requestLocationImmediately();
  }, [requestLocationImmediately, t]);

  // Pan map to location when map loads and we have coords
  useEffect(() => {
    if (map && coords) {
      map.panTo(coords);
      map.setZoom(getZoomLevel(radius));
    }
  }, [map, coords, getZoomLevel, radius]);

  // Handle map load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  // Handle map click to set location
  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newCoords = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        };
        onCoordsChange?.(newCoords);
        // Reverse geocode the clicked location
        reverseGeocode(newCoords.lat, newCoords.lng);
      }
    },
    [onCoordsChange, reverseGeocode]
  );

  // Update map zoom when radius changes
  const handleRadiusChange = useCallback(
    (newRadius: number) => {
      onRadiusChange(newRadius);
      if (map && hasLocation) {
        map.setZoom(getZoomLevel(newRadius));
      }
    },
    [onRadiusChange, map, hasLocation, getZoomLevel]
  );

  // Loading state
  if (!isLoaded) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 h-[280px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <span className="text-sm text-text-muted">{t('loadingMap')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="relative bg-red-50 rounded-2xl overflow-hidden border border-red-200 h-[280px] flex items-center justify-center p-6">
          <div className="text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-600">{t('errors.mapLoadFailed')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Google Map */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={getZoomLevel(radius)}
          options={mapOptions}
          onLoad={onMapLoad}
          onClick={onMapClick}
        >
          {/* Radius Circle */}
          {hasLocation && (
            <Circle center={center} options={circleOptions} />
          )}

          {/* Center Marker */}
          {hasLocation && (
            <Marker
              position={center}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#FF6F61',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
              }}
            />
          )}
        </GoogleMap>

        {/* Location Status Badge */}
        <div className="absolute top-3 left-3 max-w-[60%]">
          <div className={`
            px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm
            ${hasLocation 
              ? 'bg-secondary/90 text-white' 
              : 'bg-white/90 text-text-muted'
            }
          `}>
            {hasLocation && locationInfo?.city ? (
              <span className="flex items-center gap-1.5 truncate">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="truncate">{locationInfo.city}, {locationInfo.countryCode}</span>
              </span>
            ) : hasLocation ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('locationSet')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {t('clickMapOrButton')}
              </span>
            )}
          </div>
        </div>

        {/* Radius Badge */}
        {hasLocation && (
          <div className="absolute top-3 right-3">
            <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-white shadow-lg">
              {radius} km
            </div>
          </div>
        )}

        {/* Location Button */}
        <div className="absolute bottom-3 right-3">
          <Button
            type="button"
            size="sm"
            variant={hasLocation ? 'outline' : 'primary'}
            onClick={requestLocation}
            isLoading={isLocating}
            className="shadow-lg bg-white/90 backdrop-blur-sm"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {hasLocation ? t('updateLocation') : t('useMyLocation')}
          </Button>
        </div>

        {/* Permission denied warning overlay */}
        {permissionState === 'denied' && !hasLocation && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl">
            <div className="bg-white rounded-xl p-4 max-w-xs text-center shadow-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="font-semibold text-text mb-1">{t('permissionRequired')}</h4>
              <p className="text-xs text-text-muted mb-3">{t('enableLocationInBrowser')}</p>
              <p className="text-xs text-text-muted">{t('orClickOnMap')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {locationError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{locationError}</span>
        </div>
      )}

      {/* Radius Slider with quadratic scale for better precision at smaller values */}
      <Slider
        value={radius}
        onChange={handleRadiusChange}
        min={minRadius}
        max={maxRadius}
        step={1}
        label={t('radiusLabel')}
        valueFormatter={(v) => `${v} km`}
        scale="quadratic"
        ticks={[1, 5, 10, 25, 50, 100, 200].filter(t => t >= minRadius && t <= maxRadius)}
      />

      {/* Info text */}
      <p className="text-xs text-text-muted text-center mt-4">
        {t('radiusHint', { radius })}
      </p>
    </div>
  );
}
