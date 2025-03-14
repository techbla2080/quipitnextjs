"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, Navigation, Landmark, Coffee, Utensils, Building, Hotel } from "lucide-react";
import { Button } from "@/components/ui/button";
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';

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

// For useMap, we'll create a simple wrapper
const MapControllerWrapper = dynamic(() => 
  Promise.resolve(() => {
    // This only runs client-side
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useMap } = require('react-leaflet');
    const map = useMap();
    
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (map && (window as any).mapCenter && (window as any).mapZoom) {
        map.setView((window as any).mapCenter, (window as any).mapZoom);
      }
    }, [map]);
    
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
  const [mapZoom, setMapZoom] = useState(2);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [detailMode, setDetailMode] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);

  // Update global variables for the map controller
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).mapCenter = mapCenter;
      (window as any).mapZoom = mapZoom;
    }
  }, [mapCenter, mapZoom]);

  // Fix Leaflet icon issues that occur in Next.js
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/marker-icon-2x.png',
          iconUrl: '/marker-icon.png',
          shadowUrl: '/marker-shadow.png',
        });
      });
    }
  }, []);

  // Function to extract points of interest from trip data
  const extractPointsOfInterest = async (content: string, location: string): Promise<PointOfInterest[]> => {
    const pois: PointOfInterest[] = [];
    
    try {
      // Find relevant section for this location
      const locationRegex = new RegExp(`Day\\s+\\d+[^]*?\\b${location}\\b[^]*?(?=Day\\s+\\d+:|$)`, 'i');
      const locationMatch = content.match(locationRegex);
      
      if (!locationMatch) return pois;
      
      // Extract potential POIs - look for phrases that indicate locations
      const poiKeywords = [
        { type: 'museum', keywords: ['museum', 'gallery', 'exhibition'] },
        { type: 'landmark', keywords: ['temple', 'mosque', 'bridge', 'memorial', 'monument', 'palace', 'square', 'garden', 'park'] },
        { type: 'restaurant', keywords: ['restaurant', 'café', 'cafe', 'dine', 'lunch', 'dinner', 'breakfast', 'eat'] },
        { type: 'hotel', keywords: ['hotel', 'accommodation', 'stay', 'resort'] },
        { type: 'attraction', keywords: ['visit', 'explore', 'see', 'tour'] },
        { type: 'transport', keywords: ['airport', 'station', 'terminal', 'port'] }
      ];
      
      // Extract lines with activities
      const lines = locationMatch[0]
        .split(/\n|•|●|-|\.|,/)
        .map(line => line.trim())
        .filter(line => line.length > 5);
      
      for (const line of lines) {
        // Find what type of POI this might be
        let poiType: 'museum' | 'landmark' | 'restaurant' | 'hotel' | 'attraction' | 'transport' = 'attraction';
        
        for (const { type, keywords } of poiKeywords) {
          if (keywords.some(keyword => line.toLowerCase().includes(keyword))) {
            poiType = type as any;
            break;
          }
        }
        
        // Look for potential named locations in quotes or with specific indicators
        let poiName = '';
        
        // Check for quoted names
        const quoteMatch = line.match(/"([^"]+)"|"([^"]+)"|'([^']+)'/);
        if (quoteMatch) {
          poiName = quoteMatch[1] || quoteMatch[2] || quoteMatch[3];
        } else {
          // Look for patterns like "Visit the X" or "Explore Y"
          const visitMatch = line.match(/(?:visit|explore|see|tour)\s+(?:the\s+)?([A-Z][^,.]+)/i);
          if (visitMatch) {
            poiName = visitMatch[1];
          } else if (line.includes(':')) {
            // Format like "Lunch: Restaurant Name"
            const colonMatch = line.match(/(?:lunch|dinner|breakfast):\s+([^,.]+)/i);
            if (colonMatch) {
              poiName = colonMatch[1];
            }
          } else {
            // Just look for proper nouns
            const properNounMatch = line.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
            if (properNounMatch && !['Day', 'Morning', 'Afternoon', 'Evening', 'Night'].includes(properNounMatch[1])) {
              poiName = properNounMatch[1];
            }
          }
        }
        
        // If we found a POI name and it's not the main location
        if (poiName && !poiName.toLowerCase().includes(location.toLowerCase())) {
          // Try to geocode only significant POIs
          if (poiName.length > 3) {
            try {
              // Add a delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Geocode with the location context for better results
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(poiName + ', ' + location)}&limit=1`,
                {
                  headers: {
                    'User-Agent': 'TravelPlanner/1.0'
                  }
                }
              );
              
              if (response.ok) {
                const data = await response.json();
                
                if (data && data.length > 0) {
                  // Extract day number if available
                  const dayMatch = line.match(/Day\s+(\d+)/i) || locationMatch[0].match(/Day\s+(\d+)/i);
                  const day = dayMatch ? parseInt(dayMatch[1], 10) : undefined;
                  
                  pois.push({
                    name: poiName,
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    type: poiType,
                    description: line,
                    day
                  });
                }
              }
            } catch (error) {
              console.warn(`Could not geocode POI: ${poiName}`);
            }
          }
        }
      }
      
      // If we didn't find any POIs, try a more general search
      if (pois.length === 0) {
        // Just get generic popular places in the location
        const popularKeywords = ['popular', 'must-see', 'attraction', 'landmark'];
        
        for (const keyword of popularKeywords) {
          try {
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(keyword + ' ' + location)}&limit=3`,
              {
                headers: {
                  'User-Agent': 'TravelPlanner/1.0'
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              
              if (data && data.length > 0) {
                for (const place of data) {
                  // Don't add duplicates
                  if (!pois.some(poi => 
                    Math.abs(poi.lat - parseFloat(place.lat)) < 0.001 && 
                    Math.abs(poi.lng - parseFloat(place.lon)) < 0.001
                  )) {
                    pois.push({
                      name: place.display_name.split(',')[0],
                      lat: parseFloat(place.lat),
                      lng: parseFloat(place.lon),
                      type: 'attraction',
                      description: `Popular attraction in ${location}`
                    });
                  }
                }
              }
            }
            
            // If we found some places, stop searching
            if (pois.length > 0) break;
          } catch (error) {
            console.warn(`Could not find generic POIs for ${location}`);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting POIs:', error);
    }
    
    return pois;
  };

  // Process trip data and geocode locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Normalize cities to array
        const citiesArray = Array.isArray(cities) 
          ? cities 
          : typeof cities === 'string' ? cities.split(',').map(city => city.trim()) : [];
        
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
              
              // Extract activities and description from trip result
              const activities = tripResultText ? 
                await extractPointsOfInterest(tripResultText, loc) : 
                [];
              
              // Get a brief description for the location
              let description = '';
              if (tripResultText) {
                const locationRegex = new RegExp(`\\b${loc}\\b[^.]*\\.`);
                const match = tripResultText.match(locationRegex);
                if (match) {
                  description = match[0].trim();
                }
              }
              
              // Add to results
              results.push({
                name: loc,
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                day,
                description,
                isStart: i === 0,
                isEnd: i === locations.length - 1,
                pointsOfInterest: activities
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

  // Handle location selection
  const handleLocationClick = (loc: LocationData) => {
    setSelectedLocation(loc);
    setDetailMode(true);
    setMapCenter([loc.lat, loc.lng]);
    setMapZoom(13); // Zoom in closer
  };

  // Return to overview mode
  const handleBackToOverview = () => {
    setDetailMode(false);
    setSelectedLocation(null);
    
    // Reset to show all locations
    if (mapLocations.length === 1) {
      setMapCenter([mapLocations[0].lat, mapLocations[0].lng]);
      setMapZoom(10);
    } else if (mapLocations.length > 1) {
      const minLat = Math.min(...mapLocations.map(loc => loc.lat));
      const maxLat = Math.max(...mapLocations.map(loc => loc.lat));
      const minLng = Math.min(...mapLocations.map(loc => loc.lng));
      const maxLng = Math.max(...mapLocations.map(loc => loc.lng));
      
      setMapCenter([(minLat + maxLat) / 2, (minLng + maxLng) / 2]);
      
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);
      
      if (maxDiff > 20) setMapZoom(3);
      else if (maxDiff > 10) setMapZoom(4);
      else if (maxDiff > 5) setMapZoom(5);
      else if (maxDiff > 1) setMapZoom(6);
      else if (maxDiff > 0.5) setMapZoom(7);
      else setMapZoom(8);
    }
  };

  // Get appropriate icon based on POI type
  const getPoiIcon = (type: string) => {
    switch (type) {
      case 'museum': return <Landmark className="h-4 w-4 text-purple-600" />;
      case 'restaurant': return <Utensils className="h-4 w-4 text-red-600" />;
      case 'hotel': return <Building className="h-4 w-4 text-blue-600" />;
      case 'transport': return <Navigation className="h-4 w-4 text-gray-600" />;
      case 'landmark': return <Landmark className="h-4 w-4 text-amber-600" />;
      default: return <MapPin className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <MapPin className="mr-2 h-6 w-6 text-cyan-500" />
            {detailMode && selectedLocation 
              ? `Exploring ${selectedLocation.name}` 
              : "Trip Route Map"}
          </h3>
          
          {detailMode && (
            <Button 
              onClick={handleBackToOverview}
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
            >
              <Navigation className="h-4 w-4" />
              Back to Trip Overview
            </Button>
          )}
        </div>
        
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
                
                .poi-icon {
                  display: flex;
                  align-items: center;
                  gap: 4px;
                }
                
                .leaflet-popup-content {
                  margin: 8px 12px;
                  max-width: 300px;
                }
                
                .poi-popup {
                  font-size: 14px;
                }
                
                .poi-popup h3 {
                  font-weight: bold;
                  margin-bottom: 4px;
                }
                
                .poi-popup p {
                  margin-top: 4px;
                  margin-bottom: 4px;
                }
                
                .poi-popup .day {
                  display: inline-block;
                  background-color: #0ea5e9;
                  color: white;
                  font-size: 12px;
                  padding: 2px 6px;
                  border-radius: 9999px;
                  margin-left: 4px;
                }
                
                .city-marker-popup {
                  cursor: pointer;
                }
                
                .city-marker-popup:hover {
                  text-decoration: underline;
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
                
                {/* Include our map controller wrapper */}
                <MapControllerWrapper />
                
                {/* Route line connecting locations - only in overview mode */}
                {!detailMode && mapLocations.length > 1 && (
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
                    eventHandlers={{
                      click: detailMode ? undefined : () => handleLocationClick(loc)
                    }}
                  >
                    <Popup>
                      <div className="p-1">
                        <h3 
                          className={`font-bold text-base ${!detailMode ? 'city-marker-popup' : ''}`}
                          onClick={detailMode ? undefined : () => handleLocationClick(loc)}
                        >
                          {loc.name}
                          {!detailMode && (
                            <span className="text-xs ml-2 text-cyan-500">
                              (Click to explore)
                            </span>
                          )}
                        </h3>
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
                
                {/* Display Points of Interest when in detail mode */}
                {detailMode && selectedLocation && selectedLocation.pointsOfInterest && 
                  selectedLocation.pointsOfInterest.map((poi, index) => (
                    <Marker
                      key={`poi-${index}`}
                      position={[poi.lat, poi.lng]}
                    >
                      <Popup>
                        <div className="poi-popup">
                          <div className="flex items-center">
                            {getPoiIcon(poi.type)}
                            <h3 className="ml-1">{poi.name}</h3>
                            {poi.day && <span className="day">Day {poi.day}</span>}
                          </div>
                          {poi.description && (
                            <p className="text-gray-700">{poi.description}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))
                }
              </MapContainer>
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">No locations to display</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {detailMode && selectedLocation ? (
            <p>
              Showing detailed view of {selectedLocation.name}
              {selectedLocation.pointsOfInterest && selectedLocation.pointsOfInterest.length > 0 ? 
                ` with ${selectedLocation.pointsOfInterest.length} points of interest` : 
                '. No specific points of interest found in the itinerary.'}
            </p>
          ) : mapLocations.length > 1 ? (
            <>
              <p>Trip route from {mapLocations[0]?.name} to {mapLocations[mapLocations.length-1]?.name}</p>
              {dateRange && <p className="mt-1">Travel dates: {dateRange}</p>}
              <p className="mt-1 text-cyan-600">Tip: Click on any location marker to see detailed points of interest</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TripMap;