"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, Navigation, Landmark, Coffee, Utensils, Building, Hotel, Calendar } from "lucide-react";
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
  const [mapZoom, setMapZoom] = useState(2);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [detailMode, setDetailMode] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [numberOfDays, setNumberOfDays] = useState<number>(0);
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

  // Calculate number of days from the dateRange
  useEffect(() => {
    if (dateRange) {
      try {
        const [startStr, endStr] = dateRange.split(" to ");
        
        const parseDate = (dateStr: string) => {
          const [month, day, year] = dateStr.split("/").map(num => parseInt(num, 10));
          return new Date(year, month - 1, day);
        };
        
        const startDate = parseDate(startStr);
        const endDate = parseDate(endStr);
        
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          const diffTime = endDate.getTime() - startDate.getTime();
          const dayCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          setNumberOfDays(dayCount);
        }
      } catch (error) {
        console.error("Error calculating days from date range:", error);
        setNumberOfDays(0);
      }
    }
  }, [dateRange]);

  // Enhanced function to extract points of interest with improved pattern matching
  const extractPointsOfInterest = async (content: string, location: string): Promise<PointOfInterest[]> => {
    const pois: PointOfInterest[] = [];
    const processedLocations = new Set<string>(); // To avoid duplicates
    
    try {
      // Get multiple sections that might mention this location
      const locationPattern = new RegExp(`(Day\\s+\\d+[^]*?\\b${location}\\b[^]*?(?=Day\\s+\\d+:|$)|\\b${location}\\b[^.]*\\.|\\b${location}\\b[^\\n]*\\n)`, 'gi');
      const locationMatches = content.match(locationPattern) || [];
      
      // Combine all sections mentioning this location
      const combinedContent = locationMatches.join("\n");
      
      if (!combinedContent) return pois;
      
      // Extract potential POIs - expanded keywords for better coverage
      const poiKeywords = [
        { 
          type: 'museum', 
          keywords: ['museum', 'gallery', 'exhibition', 'artifacts', 'collection', 'archaeological', 'ancient', 'art', 'history'] 
        },
        { 
          type: 'landmark', 
          keywords: ['temple', 'mosque', 'bridge', 'memorial', 'monument', 'palace', 'square', 'garden', 'park', 'fort', 'castle', 'historic', 'heritage', 'statue', 'tower', 'cathedral', 'church', 'site'] 
        },
        { 
          type: 'restaurant', 
          keywords: ['restaurant', 'café', 'cafe', 'dine', 'lunch', 'dinner', 'breakfast', 'eat', 'food', 'cuisine', 'culinary', 'dining', 'eatery', 'bistro', 'pub', 'bar'] 
        },
        { 
          type: 'hotel', 
          keywords: ['hotel', 'accommodation', 'stay', 'resort', 'lodge', 'inn', 'suite', 'room', 'hostel', 'motel', 'residence'] 
        },
        { 
          type: 'attraction', 
          keywords: ['visit', 'explore', 'see', 'tour', 'attraction', 'experience', 'popular', 'famous', 'renowned', 'destination', 'spot', 'point of interest', 'highlight'] 
        },
        { 
          type: 'transport', 
          keywords: ['airport', 'station', 'terminal', 'port', 'train', 'bus', 'metro', 'subway', 'ferry', 'transportation', 'transit'] 
        }
      ];
      
      // Multiple extraction methods
      // 1. Extract from bullet points and paragraphs
      const textChunks = combinedContent
        .split(/\n|•|●|-|(?<=\.) |,/)
        .map(line => line.trim())
        .filter(line => line.length > 5);
        
      // 2. Add day by day extraction to find activities for each day
      const dayMatches = content.match(/Day\s+(\d+)[^\n]*[\n\s]+(.*?)(?=Day\s+\d+:|$)/gs) || [];
      
      for (const dayMatch of dayMatches) {
        const dayNumberMatch = dayMatch.match(/Day\s+(\d+)/);
        const day = dayNumberMatch ? parseInt(dayNumberMatch[1], 10) : undefined;
        
        if (dayMatch.toLowerCase().includes(location.toLowerCase()) && day) {
          const dayLines = dayMatch
            .split(/\n|•|●|-|(?<=\.) |,/)
            .map(line => line.trim())
            .filter(line => line.length > 5);
          
          textChunks.push(...dayLines.map(line => line + ` (Day ${day})`));
        }
      }
      
      // Process each text chunk to find POIs
      for (const line of textChunks) {
        // Determine POI type
        let poiType: 'museum' | 'landmark' | 'restaurant' | 'hotel' | 'attraction' | 'transport' = 'attraction';
        
        for (const { type, keywords } of poiKeywords) {
          if (keywords.some(keyword => line.toLowerCase().includes(keyword))) {
            poiType = type as any;
            break;
          }
        }
        
        // Multiple methods to extract POI names
        let poiName = '';
        let day: number | undefined = undefined;
        
        // Extract day information
        const dayMatch = line.match(/Day\s+(\d+)/i);
        if (dayMatch) {
          day = parseInt(dayMatch[1], 10);
        }
        
        // Method 1: Quoted text
        const quoteMatch = line.match(/"([^"]+)"|"([^"]+)"|'([^']+)'/);
        if (quoteMatch) {
          poiName = quoteMatch[1] || quoteMatch[2] || quoteMatch[3];
        } 
        // Method 2: "Visit/Explore" patterns (enhanced)
        else {
          const actionPatterns = [
            /(?:visit|explore|see|tour|discover|experience)\s+(?:the\s+)?([A-Z][^,.;:]+)/i,
            /(?:check out|go to|head to|stop by)\s+(?:the\s+)?([A-Z][^,.;:]+)/i
          ];
          
          for (const pattern of actionPatterns) {
            const match = line.match(pattern);
            if (match && match[1]) {
              poiName = match[1];
              break;
            }
          }
        }
        
        // Method 3: Colon patterns for meals and activities
        if (!poiName && line.includes(':')) {
          const colonMatch = line.match(/(?:lunch|dinner|breakfast|meal|activity):\s+([^,.;:]+)/i);
          if (colonMatch && colonMatch[1]) {
            poiName = colonMatch[1];
          }
        }
        
        // Method 4: Named entities (proper nouns)
        if (!poiName) {
          // Look for sequences of capitalized words that might be place names
          const properNounMatches = Array.from(line.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g));
          
          for (const match of properNounMatches) {
            const potentialName = match[1];
            // Filter out common words that shouldn't be POIs
            if (!['Day', 'Morning', 'Afternoon', 'Evening', 'Night', 'January', 'February', 'March', 
                 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 
                 'December', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 
                 'Saturday', 'Sunday'].includes(potentialName)) {
              poiName = potentialName;
              break;
            }
          }
        }
        
        // If we found a POI name and it's not the main location or already processed
        if (poiName && 
            !poiName.toLowerCase().includes(location.toLowerCase()) && 
            !processedLocations.has(poiName.toLowerCase())) {
          
          // Only geocode substantial POIs
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
                  processedLocations.add(poiName.toLowerCase());
                  
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
      
      // Method 5: Look for specific attractions mentioned by name in the text
      const specificAttractionPatterns = [
        /(museum|gallery|temple|mosque|bridge|fort|castle|palace|garden|park|square|market) of ([A-Z][^,.;:]+)/gi,
        /([A-Z][a-z]+ (?:museum|gallery|temple|mosque|bridge|fort|castle|palace|garden|park|square|market))/g
      ];
      
      for (const pattern of specificAttractionPatterns) {
        const matches = Array.from(combinedContent.matchAll(pattern));
        
        for (const match of matches) {
          const attractionName = match[0];
          
          if (!processedLocations.has(attractionName.toLowerCase())) {
            try {
              await new Promise(resolve => setTimeout(resolve, 300));
              
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(attractionName + ', ' + location)}&limit=1`,
                {
                  headers: {
                    'User-Agent': 'TravelPlanner/1.0'
                  }
                }
              );
              
              if (response.ok) {
                const data = await response.json();
                
                if (data && data.length > 0) {
                  processedLocations.add(attractionName.toLowerCase());
                  
                  // Try to determine the day
                  let day: number | undefined = undefined;
                  for (let i = 1; i <= 30; i++) {
                    if (combinedContent.includes(`Day ${i}`) && 
                        combinedContent.indexOf(`Day ${i}`) < combinedContent.indexOf(attractionName)) {
                      day = i;
                      break;
                    }
                  }
                  
                  // Determine type based on attraction name
                  let type: 'museum' | 'landmark' | 'restaurant' | 'hotel' | 'attraction' | 'transport' = 'attraction';
                  
                  if (/museum|gallery/i.test(attractionName)) type = 'museum';
                  else if (/temple|mosque|palace|fort|castle|bridge|park|garden|square/i.test(attractionName)) type = 'landmark';
                  
                  pois.push({
                    name: attractionName,
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    type,
                    description: `Visit the ${attractionName}`,
                    day
                  });
                }
              }
            } catch (error) {
              console.warn(`Could not geocode specific attraction: ${attractionName}`);
            }
          }
        }
      }
      
      // If we still don't have many POIs, try a more general search
      if (pois.length < 3) {
        // Get popular places in the location
        const popularKeywords = ['popular', 'must-see', 'attraction', 'landmark', 'famous'];
        
        for (const keyword of popularKeywords) {
          try {
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(keyword + ' ' + location)}&limit=5`,
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
                  const placeName = place.display_name.split(',')[0];
                  
                  // Don't add duplicates based on name or coordinates
                  if (!processedLocations.has(placeName.toLowerCase()) &&
                      !pois.some(poi => 
                        Math.abs(poi.lat - parseFloat(place.lat)) < 0.001 && 
                        Math.abs(poi.lng - parseFloat(place.lon)) < 0.001
                      )) {
                    
                    processedLocations.add(placeName.toLowerCase());
                    
                    // Determine attraction type based on OSM tags or name
                    let type: 'museum' | 'landmark' | 'restaurant' | 'hotel' | 'attraction' | 'transport' = 'attraction';
                    
                    const lowerName = placeName.toLowerCase();
                    if (/museum|gallery/i.test(lowerName)) type = 'museum';
                    else if (/restaurant|café|cafe|dining/i.test(lowerName)) type = 'restaurant';
                    else if (/hotel|resort|accommodation/i.test(lowerName)) type = 'hotel';
                    else if (/temple|mosque|church|monument|palace|bridge/i.test(lowerName)) type = 'landmark';
                    else if (/airport|station|terminal/i.test(lowerName)) type = 'transport';
                    
                    pois.push({
                      name: placeName,
                      lat: parseFloat(place.lat),
                      lng: parseFloat(place.lon),
                      type,
                      description: `Popular attraction in ${location}`
                    });
                  }
                }
              }
            }
            
            // If we found enough places, stop searching
            if (pois.length >= 5) break;
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
              
              console.log(`Found ${activities.length} points of interest for ${loc}`);
              
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

  // Handle location selection with deeper street-level zoom
  const handleLocationClick = (loc: LocationData) => {
    setSelectedLocation(loc);
    setDetailMode(true);
    setMapCenter([loc.lat, loc.lng]);
    setMapZoom(17); // Set to 17 for street-level details
    setSelectedDay(null); // Reset day filter when changing location
  };

  // Return to overview mode
  const handleBackToOverview = () => {
    setDetailMode(false);
    setSelectedLocation(null);
    setSelectedDay(null);
    
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

  // Get total count of POIs for the current selected location
  const getTotalPOICount = () => {
    if (!selectedLocation || !selectedLocation.pointsOfInterest) return 0;
    return selectedLocation.pointsOfInterest.length;
  };

  // Get filtered POIs based on selected day
  const getFilteredPOIs = () => {
    if (!selectedLocation || !selectedLocation.pointsOfInterest) return [];
    if (selectedDay === null) return selectedLocation.pointsOfInterest;
    return selectedLocation.pointsOfInterest.filter(poi => poi.day === selectedDay);
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
        
        {/* Day filter buttons - only show in detail mode */}
        {detailMode && selectedLocation && selectedLocation.pointsOfInterest && selectedLocation.pointsOfInterest.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-cyan-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by day:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant={selectedDay === null ? "default" : "outline"}
                onClick={() => setSelectedDay(null)}
                className="text-xs px-3 py-1 h-7"
              >
                All Days
              </Button>
              {Array.from({ length: numberOfDays }).map((_, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={selectedDay === i+1 ? "default" : "outline"}
                  onClick={() => setSelectedDay(i+1)}
                  className="text-xs px-3 py-1 h-7"
                >
                  Day {i+1}
                </Button>
              ))}
            </div>
          </div>
        )}
        
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
                
                /* Enhanced animation styles */
                .leaflet-fade-anim .leaflet-tile,
                .leaflet-zoom-anim .leaflet-zoom-animated {
                  will-change: auto !important;
                  transition: transform 0.25s cubic-bezier(0.25, 0.1, 0.25, 1) !important;
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
                        {loc.pointsOfInterest && loc.pointsOfInterest.length > 0 && !detailMode && (
                          <p className="text-sm text-cyan-600 mt-2">
                            {loc.pointsOfInterest.length} points of interest available
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Display Points of Interest when in detail mode */}
                {detailMode && selectedLocation && selectedLocation.pointsOfInterest && 
                  getFilteredPOIs().map((poi, index) => (
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
                ` with ${selectedDay === null ? getTotalPOICount() : getFilteredPOIs().length} points of interest${selectedDay !== null ? ` for Day ${selectedDay}` : ''}` : 
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