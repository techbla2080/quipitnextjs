"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

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
  const [mapZoom, setMapZoom] = useState(2);

  // Fix Leaflet icon issues that occur in Next.js
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Import Leaflet
      import('leaflet').then((L) => {
        // Delete the default icon
        delete (L.Icon.Default.prototype as any)._getIconUrl;

        // Set default icon paths - these need to be in your public folder
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/marker-icon-2x.png',
          iconUrl: '/marker-icon.png',
          shadowUrl: '/marker-shadow.png',
        });
      });
    }
  }, []);

  // Process trip data and geocode locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Normalize cities to array
        const citiesArray = Array.isArray(cities) 
          ? cities 
          : cities.split(',').map(city => city.trim());
        
        // Combine location and cities
        const allLocations = [location, ...citiesArray].filter(loc => loc && loc.trim() !== '');
        
        if (allLocations.length === 0) {
          setIsLoading(false);
          setError("No locations to display");
          return;
        }

        // Convert the trip result to a string if it's not already
        const tripResultText = typeof tripResult === 'string' 
          ? tripResult 
          : JSON.stringify(tripResult);

        // Extract location information from tripResult
        const extractActivityLocations = (text: string, locationName: string): string[] => {
          try {
            // Find the day that mentions this location
            const regex = new RegExp(`Day \\d+:[^]*?\\b${locationName}\\b[^]*?(?=Day \\d+:|$)`, 'i');
            const match = text.match(regex);
            
            if (!match) return [];
            
            // Extract key attractions from this section
            const attractions = match[0]
              .split(/\n|•|-|\.|,/)
              .map(line => line.trim())
              .filter(line => 
                line.length > 0 && 
                line.includes("Visit") || 
                line.includes("Explore") || 
                line.includes("Temple") || 
                line.includes("Museum") || 
                line.includes("Palace") || 
                line.includes("Bridge")
              );
              
            return attractions;
          } catch {
            return [];
          }
        };
        
        // Process each location with a delay to avoid rate limiting
        const processWithDelay = async (locations: string[]) => {
          const results: LocationData[] = [];
          
          for (let i = 0; i < locations.length; i++) {
            const loc = locations[i];
            
            // Skip empty locations
            if (!loc || loc.trim() === '') continue;
            
            try {
              // Add delay between requests to avoid rate limiting
              if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              
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
                console.warn(`Failed to geocode ${loc}: ${response.statusText}`);
                continue;
              }
              
              const data = await response.json();
              
              if (!data || !data.length) {
                console.warn(`No coordinates found for ${loc}`);
                continue;
              }
              
              // Find day information from tripResult
              let day: number | undefined = undefined;
              if (tripResultText && i > 0) {
                const dayMatch = tripResultText.match(new RegExp(`Day (\\d+):[^]*?\\b${loc}\\b`, 'i'));
                if (dayMatch && dayMatch[1]) {
                  day = parseInt(dayMatch[1], 10);
                }
              }
              
              // Get activities for this location
              const activities = tripResultText ? extractActivityLocations(tripResultText, loc) : [];
              const description = activities.length > 0 
                ? `Activities: ${activities.slice(0, 3).join(', ')}` 
                : undefined;
              
              // Add to results
              results.push({
                name: loc,
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                day,
                description,
                isStart: i === 0,
                isEnd: i === locations.length - 1
              });
            } catch (err) {
              console.error(`Error geocoding ${loc}:`, err);
            }
          }
          
          return results;
        };
        
        const locationData = await processWithDelay(allLocations);
        
        if (locationData.length === 0) {
          setError('Could not find coordinates for any locations');
          setIsLoading(false);
          return;
        }
        
        setMapLocations(locationData);
        
        // Calculate map center and zoom level
        if (locationData.length === 1) {
          // If only one location, center on it
          setMapCenter([locationData[0].lat, locationData[0].lng]);
          setMapZoom(10);
        } else {
          // Find bounds to include all locations
          const minLat = Math.min(...locationData.map(loc => loc.lat));
          const maxLat = Math.max(...locationData.map(loc => loc.lat));
          const minLng = Math.min(...locationData.map(loc => loc.lng));
          const maxLng = Math.max(...locationData.map(loc => loc.lng));
          
          // Center is the average
          setMapCenter([(minLat + maxLat) / 2, (minLng + maxLng) / 2]);
          
          // Set zoom based on the distance between points
          const latDiff = maxLat - minLat;
          const lngDiff = maxLng - minLng;
          const maxDiff = Math.max(latDiff, lngDiff);
          
          // Adjust zoom level based on the distance
          if (maxDiff > 20) setMapZoom(3);
          else if (maxDiff > 10) setMapZoom(4);
          else if (maxDiff > 5) setMapZoom(5);
          else if (maxDiff > 1) setMapZoom(6);
          else if (maxDiff > 0.5) setMapZoom(7);
          else setMapZoom(8);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error setting up map:', err);
        setError('Failed to load map data');
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [location, cities, tripResult]);

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
          <MapPin className="mr-2 h-6 w-6 text-cyan-500" />
          Trip Route Map
        </h3>
        
        <div className="h-96 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              <span className="ml-3 text-gray-600 dark:text-gray-300">Loading map data...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full bg-red-50 dark:bg-red-900/20 p-4">
              <div className="text-red-500 dark:text-red-400 text-center mb-4">
                <p>{error}</p>
              </div>
              <Button 
                onClick={() => setIsLoading(true)} 
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                Try Again
              </Button>
            </div>
          ) : mapLocations.length > 0 ? (
            <>
              {/* Required CSS for Leaflet */}
              <style jsx global>{`
                .leaflet-container {
                  height: 100%;
                  width: 100%;
                  z-index: 1;
                }
              `}</style>
              
              <MapContainer 
                center={mapCenter} 
                zoom={mapZoom} 
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Route line connecting locations */}
                {mapLocations.length > 1 && (
                  <Polyline 
                    positions={mapLocations.map(loc => [loc.lat, loc.lng])}
                    color="#0ea5e9"
                    weight={3}
                    opacity={0.7}
                    dashArray="5, 10"
                  />
                )}
                
                {/* Markers for each location */}
                {mapLocations.map((loc, index) => (
                  <Marker 
                    key={`${loc.name}-${index}`}
                    position={[loc.lat, loc.lng]}
                  >
                    <Popup>
                      <div className="p-1">
                        <h3 className="font-bold text-base">{loc.name}</h3>
                        {loc.day && (
                          <p className="text-sm text-gray-600 mt-1">Day {loc.day}</p>
                        )}
                        {loc.isStart && (
                          <p className="text-sm text-cyan-600 mt-1">Starting Point</p>
                        )}
                        {loc.isEnd && (
                          <p className="text-sm text-indigo-600 mt-1">Destination</p>
                        )}
                        {loc.description && (
                          <p className="text-sm mt-2">{loc.description}</p>
                        )}
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
        
        {mapLocations.length > 1 && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>Trip route from {mapLocations[0]?.name} to {mapLocations[mapLocations.length-1]?.name}</p>
            {dateRange && <p className="mt-1">Travel dates: {dateRange}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripMap;