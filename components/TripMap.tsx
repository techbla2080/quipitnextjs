"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, Navigation, Landmark, Coffee, Utensils, Building, Hotel, Calendar, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap, DivIcon } from 'leaflet';

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
) as any;

const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
) as any;

const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
) as any;

const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
) as any;

const Polyline = dynamic(
  () => import('react-leaflet').then(mod => mod.Polyline),
  { ssr: false }
) as any;

const CircleMarker = dynamic(
  () => import('react-leaflet').then(mod => mod.CircleMarker),
  { ssr: false }
) as any;

// For useMap, we'll create a simple wrapper with enhanced animation
const MapControllerWrapper = dynamic(() => 
  Promise.resolve(() => {
    // This only runs client-side
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useMap } = require('react-leaflet');
    const map = useMap();
    
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (map && (window as any).mapCenter && (window as any).mapZoom) {
        // Use flyTo for smooth animation instead of setView
        map.flyTo(
          (window as any).mapCenter, 
          (window as any).mapZoom, 
          {
            duration: 1.5, // Animation duration in seconds
            easeLinearity: 0.25 // Makes animation more natural
          }
        );
      }
    }, [map, (window as any).mapCenter, (window as any).mapZoom]);
    
    return null;
  }),
  { ssr: false }
) as any;

// Define types
interface TripMapProps {
  location: string;
  cities: string[] | string;
  dateRange?: string;
  tripResult?: string | any;
  className?: string;
}

interface LocationData {
  name: string;
  lat: number;
  lng: number;
  day?: number;
  description?: string;
  isStart?: boolean;
  isEnd?: boolean;
  pointsOfInterest?: PointOfInterest[];
}

interface PointOfInterest {
  name: string;
  lat: number;
  lng: number;
  type: 'museum' | 'landmark' | 'restaurant' | 'hotel' | 'attraction' | 'transport';
  description?: string;
  day?: number;
}

const TripMap: React.FC<TripMapProps> = ({ 
  location, 
  cities, 
  dateRange, 
  tripResult,
  className = ""
}) => {
  const [mapLocations, setMapLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [mapZoom, setMapZoom] = useState(5);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [detailMode, setDetailMode] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [numberOfDays, setNumberOfDays] = useState<number>(0);
  const mapRef = useRef<LeafletMap | null>(null);
  
  // Flight animation state
  const [flightAnimation, setFlightAnimation] = useState({
    isAnimating: false,
    progress: 0,
    startPoint: [0, 0] as [number, number],
    endPoint: [0, 0] as [number, number]
  });
  const animationRef = useRef<number | null>(null);
  // Reference to leaflet
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      console.log("TripMap: Safety timeout started");
      const timeout = setTimeout(() => {
        console.log("TripMap: Safety timeout triggered after 45 seconds");
        setIsLoading(false);
        
        // Use hardcoded data if we didn't load any real data
        if (mapLocations.length === 0) {
          // This is just a fallback to ensure something displays
          console.log("TripMap: No locations loaded, using default locations");
          
          // Default to Dubai and Delhi if no real data available
          const defaultLocations = [
            {
              name: location || "Dubai",
              lat: 25.2048,
              lng: 55.2708,
              isStart: true,
              isEnd: false,
              description: "Starting point of your journey"
            },
            {
              name: Array.isArray(cities) && cities.length > 0 ? cities[0] : "Delhi",
              lat: 28.6139,
              lng: 77.2090,
              isStart: false,
              isEnd: true,
              description: "Your destination"
            }
          ];
          
          setMapLocations(defaultLocations);
          setMapCenter([(defaultLocations[0].lat + defaultLocations[1].lat) / 2, 
                       (defaultLocations[0].lng + defaultLocations[1].lng) / 2]);
          setMapZoom(6);
          
          // Start the flight animation automatically
          setTimeout(() => {
            startFlightAnimation(
              [defaultLocations[0].lat, defaultLocations[0].lng],
              [defaultLocations[1].lat, defaultLocations[1].lng]
            );
          }, 1000);
        }
      }, 45000); // 45 seconds timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading, location, cities, mapLocations]);

  // Update global variables for the map controller and ensure map flies to locations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).mapCenter = mapCenter;
      (window as any).mapZoom = mapZoom;
      
      // If we have the map reference and new coordinates, fly to them
      if (mapRef.current && mapCenter[0] !== 0 && mapCenter[1] !== 0) {
        mapRef.current.flyTo(mapCenter, mapZoom, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    }
  }, [mapCenter, mapZoom]);

  // Fix Leaflet icon issues that occur in Next.js
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("TripMap: Setting up Leaflet icons");
      import('leaflet').then((L) => {
        leafletRef.current = L; // Store reference to Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/marker-icon-2x.png',
          iconUrl: '/marker-icon.png',
          shadowUrl: '/marker-shadow.png',
        });
        console.log("TripMap: Leaflet icons configured");
      }).catch(e => {
        console.error("TripMap: Failed to configure Leaflet icons:", e);
      });
    }
  }, []);

  // Flight animation functions
  const calculateCurvedPath = (start: [number, number], end: [number, number], numPoints = 50): [number, number][] => {
    const result: [number, number][] = [];
    
    // Calculate midpoint and elevate it
    const midLat = (start[0] + end[0]) / 2;
    const midLng = (start[1] + end[1]) / 2;
    
    // Calculate distance for proportional arc height
    const dLat = end[0] - start[0];
    const dLng = end[1] - start[1];
    const distance = Math.sqrt(dLat * dLat + dLng * dLng);
    
    // Higher arc for longer distances
    const arcHeight = distance * 0.15;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      
      // Elevation follows a sin curve for natural takeoff/landing
      const elevation = Math.sin(t * Math.PI) * arcHeight;
      
      // Basic bezier curve calculation
      const lat = (1 - t) * start[0] + t * end[0];
      const lng = (1 - t) * start[1] + t * end[1];
      
      // Apply elevation primarily to latitude
      const elevatedLat = lat + elevation * (Math.abs(dLat) > Math.abs(dLng) ? 0.5 : 0.1);
      
      result.push([elevatedLat, lng]);
    }
    
    return result;
  };
  
  // Start the flight animation
  const startFlightAnimation = (startPoint: [number, number], endPoint: [number, number]) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // First ensure the map is positioned to see both points
    if (mapRef.current) {
      // Calculate center between points
      const centerLat = (startPoint[0] + endPoint[0]) / 2;
      const centerLng = (startPoint[1] + endPoint[1]) / 2;
      
      // Calculate distance to determine zoom
      const latDiff = Math.abs(endPoint[0] - startPoint[0]);
      const lngDiff = Math.abs(endPoint[1] - startPoint[1]);
      const maxDiff = Math.max(latDiff, lngDiff);
      
      // Determine appropriate zoom
      let newZoom = 9;
      if (maxDiff > 20) newZoom = 5;
      else if (maxDiff > 10) newZoom = 6;
      else if (maxDiff > 5) newZoom = 7;
      else if (maxDiff > 1) newZoom = 8;
      
      // Fly to position that shows both points
      mapRef.current.flyTo([centerLat, centerLng], newZoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
      
      // Wait for map to finish flying before starting the animation
      setTimeout(() => {
        startActualAnimation();
      }, 1600); // Slightly longer than the flyTo duration
    } else {
      startActualAnimation();
    }
    
    function startActualAnimation() {
      setFlightAnimation({
        isAnimating: true,
        progress: 0,
        startPoint,
        endPoint
      });
      
      let startTime: number | null = null;
      const duration = 5000; // 5 seconds
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setFlightAnimation(prev => ({
          ...prev,
          progress
        }));
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setFlightAnimation(prev => ({
            ...prev,
            isAnimating: false
          }));
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
      console.log("TripMap: Flight animation started");
    }
  };
  
  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Process trip data and geocode locations
  useEffect(() => {
    const fetchLocations = async () => {
      console.log("TripMap: Starting fetchLocations", { 
        location, 
        cities: Array.isArray(cities) ? cities : String(cities),
        dateRange
      });
      
      try {
        setIsLoading(true);
        setError(null);

        // Normalize cities to array
        const citiesArray = Array.isArray(cities) 
          ? cities 
          : typeof cities === 'string' ? cities.split(',').map(city => city.trim()) : [];
        
        // Combine location and cities
        const allLocations = [location, ...citiesArray].filter(loc => loc && loc.trim() !== '');
        console.log("TripMap: All locations to process:", allLocations);
        
        if (allLocations.length === 0) {
          console.log("TripMap: No locations to display");
          setIsLoading(false);
          return;
        }

        // Simplified location processing - just geocode main locations
        const results: LocationData[] = [];
        
        for (let i = 0; i < allLocations.length; i++) {
          const loc = allLocations[i];
          
          // Skip empty locations
          if (!loc || loc.trim() === '') continue;
          
          try {
            // Add delay between requests to avoid rate limiting
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            console.log(`TripMap: Attempting to geocode location "${loc}"`);
            // Geocode the location using OpenStreetMap Nominatim
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1`,
              {
                headers: {
                  'User-Agent': 'TravelPlanner/1.0'
                }
              }
            );
            
            if (!response.ok) {
              console.warn(`TripMap: Failed to geocode ${loc}: ${response.statusText}`);
              continue;
            }
            
            const data = await response.json();
            
            if (!data || !data.length) {
              console.warn(`TripMap: No coordinates found for ${loc}`);
              continue;
            }
            
            console.log(`TripMap: Successfully geocoded "${loc}"`, {
              lat: data[0].lat,
              lng: data[0].lon
            });
            
            // Add to results - simplified without POIs
            results.push({
              name: loc,
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              isStart: i === 0,
              isEnd: i === allLocations.length - 1,
              description: `${i === 0 ? 'Starting point' : 'Destination'} of your journey`
            });
          } catch (err) {
            console.error(`TripMap: Error geocoding ${loc}:`, err);
          }
        }
        
        if (results.length === 0) {
          console.log("TripMap: Couldn't geocode any locations");
          setIsLoading(false);
          return;
        }
        
        console.log("TripMap: Successfully geocoded locations:", results);
        setMapLocations(results);
        
        // Calculate map center and zoom level
        if (results.length === 1) {
          // If only one location, center on it
          setMapCenter([results[0].lat, results[0].lng]);
          setMapZoom(12);
        } else {
          // Find bounds to include all locations
          const minLat = Math.min(...results.map(loc => loc.lat));
          const maxLat = Math.max(...results.map(loc => loc.lat));
          const minLng = Math.min(...results.map(loc => loc.lng));
          const maxLng = Math.max(...results.map(loc => loc.lng));
          
          // Center is the average
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          setMapCenter([centerLat, centerLng]);
          
          // Set zoom based on the distance between points
          const latDiff = maxLat - minLat;
          const lngDiff = maxLng - minLng;
          const maxDiff = Math.max(latDiff, lngDiff);
          
          let newZoom = 9;
          // Adjust zoom level based on the distance - increase all zoom levels
          if (maxDiff > 20) newZoom = 5;
          else if (maxDiff > 10) newZoom = 6;
          else if (maxDiff > 5) newZoom = 7;
          else if (maxDiff > 1) newZoom = 8;
          else if (maxDiff > 0.5) newZoom = 9;
          
          setMapZoom(newZoom);
          
          // Start flight animation automatically if we have two locations
          if (results.length >= 2) {
            setTimeout(() => {
              startFlightAnimation(
                [results[0].lat, results[0].lng],
                [results[1].lat, results[1].lng]
              );
            }, 1500);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('TripMap: Error setting up map:', err);
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [location, cities]);

  // Calculate current position along curved path
  const getCurrentPosition = (path: [number, number][], progress: number): [number, number] => {
    if (!path.length) return [0, 0];
    if (progress <= 0) return path[0];
    if (progress >= 1) return path[path.length - 1];
    
    const index = Math.floor(progress * (path.length - 1));
    const t = (progress * (path.length - 1)) % 1;
    
    if (index >= path.length - 1) return path[path.length - 1];
    
    const p0 = path[index];
    const p1 = path[index + 1];
    
    return [
      p0[0] + (p1[0] - p0[0]) * t,
      p0[1] + (p1[1] - p0[1]) * t
    ];
  };

  // Calculate bearing for plane rotation
  const calculateBearing = (p1: [number, number], p2: [number, number]): number => {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const toDeg = (rad: number) => rad * 180 / Math.PI;
    
    const lat1 = toRad(p1[0]);
    const lng1 = toRad(p1[1]);
    const lat2 = toRad(p2[0]);
    const lng2 = toRad(p2[1]);
    
    const dLng = lng2 - lng1;
    
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    let bearing = toDeg(Math.atan2(y, x));
    bearing = (bearing + 360) % 360;
    
    return bearing;
  };

  // Function to create plane icon
  const createPlaneIcon = (rotation: number): DivIcon | null => {
    if (!leafletRef.current) return null;
    
    return leafletRef.current.divIcon({
      html: `
        <div style="transform: rotate(${rotation}deg);">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="#0ea5e9" stroke="#ffffff" stroke-width="1">
            <path d="M22 12a1 1 0 0 0-.76-.983L4.24 7.017A1 1 0 0 0 3 8v4l7 2-7 2v4a1 1 0 0 0 1.24.983L21.24 17a1 1 0 0 0 0-1.966L12 12.83l10-2.83z"/>
          </svg>
        </div>
      `,
      className: 'flight-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <MapPin className="mr-2 h-6 w-6 text-cyan-500" />
            Trip Route Map
          </h3>
        </div>
        
        <div className="h-96 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mb-4" />
              <span className="text-gray-600 dark:text-gray-300">Loading map data...</span>
              
              <div className="mt-4 text-xs text-left max-w-md p-2">
                <p className="text-gray-500">Debug info:</p>
                <p className="text-gray-500">Location: {location || "none"}</p>
                <p className="text-gray-500">Cities: {Array.isArray(cities) ? cities.join(", ") : (cities || "none")}</p>
                <p className="text-gray-500">Date range: {dateRange || "none"}</p>
              </div>
            </div>
          ) : mapLocations.length > 0 ? (
            <>
              {/* Required CSS for Leaflet and Flight Animation */}
              <style jsx global>{`
                .leaflet-container {
                  height: 100%;
                  width: 100%;
                  z-index: 1;
                }
                
                .flight-marker {
                  filter: drop-shadow(0 0 4px rgba(14, 165, 233, 0.7));
                  animation: pulse 2s infinite;
                }
                
                .flight-path {
                  animation: dash 5s linear infinite;
                  stroke-dasharray: 10, 10;
                }
                
                @keyframes pulse {
                  0% { transform: scale(1); opacity: 0.9; }
                  50% { transform: scale(1.1); opacity: 1; }
                  100% { transform: scale(1); opacity: 0.9; }
                }
                
                @keyframes dash {
                  to { stroke-dashoffset: 100; }
                }
              `}</style>
              
              <MapContainer 
                center={mapCenter} 
                zoom={mapZoom} 
                scrollWheelZoom={true}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapControllerWrapper />
                
                {/* Flight animation */}
                {flightAnimation.isAnimating && (() => {
                  const path = calculateCurvedPath(flightAnimation.startPoint, flightAnimation.endPoint);
                  const visiblePath = path.slice(0, Math.ceil(path.length * flightAnimation.progress));
                  const currentPosition = getCurrentPosition(path, flightAnimation.progress);
                  
                  // Calculate rotation by finding next point
                  const nextPointIndex = Math.min(
                    Math.ceil(path.length * flightAnimation.progress) + 1,
                    path.length - 1
                  );
                  const nextPoint = path[nextPointIndex];
                  const rotation = calculateBearing(currentPosition, nextPoint || flightAnimation.endPoint);
                  
                  // Get plane icon
                  const planeIcon = createPlaneIcon(rotation);
                  
                  return (
                    <>
                      {/* Animated curved path */}
                      <Polyline 
                        positions={visiblePath}
                        pathOptions={{
                          color: "#0ea5e9",
                          weight: 3,
                          opacity: 0.7,
                          dashArray: "5, 10",
                          className: "flight-path"
                        }}
                      />
                      
                      {/* Plane marker with rotation */}
                      {planeIcon && (
                        <Marker
                          position={currentPosition}
                          icon={planeIcon}
                        />
                      )}
                      
                      {/* Take-off effect */}
                      {flightAnimation.progress < 0.2 && (
                        <CircleMarker
                          center={flightAnimation.startPoint}
                          radius={10 * (1 - flightAnimation.progress*5)}
                          pathOptions={{
                            color: '#0ea5e9',
                            fillColor: '#0ea5e9',
                            fillOpacity: 0.3 * (1 - flightAnimation.progress*5)
                          }}
                        />
                      )}
                      
                      {/* Landing effect */}
                      {flightAnimation.progress > 0.8 && (
                        <CircleMarker
                          center={flightAnimation.endPoint}
                          radius={10 * ((flightAnimation.progress - 0.8) * 5)}
                          pathOptions={{
                            color: '#0ea5e9',
                            fillColor: '#0ea5e9',
                            fillOpacity: 0.3 * ((flightAnimation.progress - 0.8) * 5)
                          }}
                        />
                      )}
                    </>
                  );
                })()}
                
                {/* Static route line when not animating */}
                {!flightAnimation.isAnimating && mapLocations.length > 1 && (
                  <Polyline 
                    positions={mapLocations.map(loc => [loc.lat, loc.lng])}
                    pathOptions={{
                      color: "#0ea5e9",
                      weight: 3,
                      opacity: 0.7,
                      dashArray: "5, 10"
                    }}
                  />
                )}
                
                {/* Location markers */}
                {mapLocations.map((loc, index) => (
                  <Marker 
                    key={`${loc.name}-${index}`}
                    position={[loc.lat, loc.lng]}
                  >
                    <Popup>
                      <div className="p-1">
                        <h3 className="font-bold text-base">{loc.name}</h3>
                        {loc.isStart && <p className="text-sm text-cyan-600 mt-1">Starting Point</p>}
                        {loc.isEnd && <p className="text-sm text-indigo-600 mt-1">Destination</p>}
                        {loc.description && <p className="text-sm mt-2">{loc.description}</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">No locations to display</p>
            </div>
          )}
        </div>
        
        {/* Simple location info */}
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {mapLocations.length > 1 && (
            <p>Trip route from {mapLocations[0]?.name} to {mapLocations[mapLocations.length-1]?.name}</p>
          )}
        </div>
        
        {/* Animation control button */}
        {mapLocations.length > 1 && !flightAnimation.isAnimating && (
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={() => startFlightAnimation(
                [mapLocations[0].lat, mapLocations[0].lng],
                [mapLocations[1].lat, mapLocations[1].lng]
              )}
              className="bg-cyan-500 hover:bg-cyan-600 text-white flex items-center gap-2"
            >
              <Plane className="h-4 w-4" />
              Animate Flight
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripMap;