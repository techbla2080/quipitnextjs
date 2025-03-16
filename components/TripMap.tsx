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

  // Add safety timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      console.log("TripMap: Safety timeout started");
      const timeout = setTimeout(() => {
        console.log("TripMap: Safety timeout triggered after 15 seconds");
        setIsLoading(false);
        setError("Map loading timed out. Check console for detailed logs.");
      }, 15000); // 15 seconds timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

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
      console.log("TripMap: Setting up Leaflet icons");
      import('leaflet').then((L) => {
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

// Calculate number of days from the dateRange
useEffect(() => {
  console.log("TripMap: Processing date range", dateRange);
  setNumberOfDays(1); // Default to 1 day
  
  if (!dateRange || typeof dateRange !== 'string') {
    console.log("TripMap: Date range is undefined or not a string");
    return;
  }
  
  try {
    if (!dateRange.includes(" to ")) {
      console.log("TripMap: Date range doesn't contain 'to' separator:", dateRange);
      return;
    }
    
    const [startStr, endStr] = dateRange.split(" to ");
    
    if (!startStr || !endStr) {
      console.log("TripMap: Invalid date range format after split:", dateRange);
      return;
    }
    
    const parseDate = (dateStr: string) => {
      if (!dateStr.includes("/")) {
        throw new Error("Date string doesn't contain expected '/' separators");
      }
      
      const parts = dateStr.split("/");
      if (parts.length !== 3) {
        throw new Error("Date string doesn't have 3 parts (month/day/year)");
      }
      
      const [month, day, year] = parts.map(num => parseInt(num, 10));
      return new Date(year, month - 1, day);
    };
    
    const startDate = parseDate(startStr);
    const endDate = parseDate(endStr);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log("TripMap: Invalid date parsed from strings:", startStr, endStr);
      return;
    }
    
    const diffTime = endDate.getTime() - startDate.getTime();
    const dayCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    setNumberOfDays(dayCount);
    console.log("TripMap: Calculated days count:", dayCount);
  } catch (error) {
    console.error("TripMap: Error calculating days from date range:", error);
  }
}, [dateRange]);

  // Enhanced function to extract points of interest with improved pattern matching
  const extractPointsOfInterest = async (content: string, location: string): Promise<PointOfInterest[]> => {
    console.log(`TripMap: Extracting POIs for ${location}`);
    const pois: PointOfInterest[] = [];
    const processedLocations = new Set<string>(); // To avoid duplicates
    
    try {
      // Get multiple sections that might mention this location
      const locationPattern = new RegExp(`(Day\\s+\\d+[^]*?\\b${location}\\b[^]*?(?=Day\\s+\\d+:|$)|\\b${location}\\b[^.]*\\.|\\b${location}\\b[^\\n]*\\n)`, 'gi');
      const locationMatches = content.match(locationPattern) || [];
      
      // Combine all sections mentioning this location
      const combinedContent = locationMatches.join("\n");
      
      if (!combinedContent) {
        console.log(`TripMap: No content found for location ${location}`);
        return pois;
      }
      
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
      let textChunks = [];
      try {
        textChunks = combinedContent
          .split(/\n|•|●|-|,/)
          .map(line => line.trim())
          .filter(line => line.length > 5);
        console.log(`TripMap: Extracted ${textChunks.length} text chunks for POI detection`);
      } catch (error) {
        console.error("TripMap: Error splitting text chunks:", error);
        // Fallback method
        textChunks = combinedContent.split(/\n/).filter(line => line.trim().length > 5);
      }
        
      // 2. Add day by day extraction to find activities for each day
      try {
        const dayMatches = content.match(/Day\s+(\d+)[^\n]*[\n\s]+(.*?)(?=Day\s+\d+:|$)/gs) || [];
        console.log(`TripMap: Found ${dayMatches.length} day sections`);
        
        for (const dayMatch of dayMatches) {
          const dayNumberMatch = dayMatch.match(/Day\s+(\d+)/);
          const day = dayNumberMatch ? parseInt(dayNumberMatch[1], 10) : undefined;
          
          if (dayMatch.toLowerCase().includes(location.toLowerCase()) && day) {
            let dayLines = [];
            try {
              dayLines = dayMatch
                .split(/\n|•|●|-|,/)
                .map(line => line.trim())
                .filter(line => line.length > 5);
            } catch (error) {
              console.error(`TripMap: Error processing day ${day} content:`, error);
              // Fallback method
              dayLines = dayMatch.split(/\n/).filter(line => line.trim().length > 5);
            }
            
            textChunks.push(...dayLines.map(line => line + ` (Day ${day})`));
          }
        }
      } catch (error) {
        console.error("TripMap: Error processing day matches:", error);
      }
      
      // Process each text chunk to find POIs
      let poisFound = 0;
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
          try {
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
          } catch (error) {
            console.error("TripMap: Error extracting named entities:", error);
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
              
              console.log(`TripMap: Attempting to geocode POI "${poiName}" in ${location}`);
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
                  poisFound++;
                  console.log(`TripMap: Found POI "${poiName}" (${poiType}) at coordinates ${data[0].lat},${data[0].lon}`);
                } else {
                  console.log(`TripMap: No coordinates found for POI "${poiName}"`);
                }
              } else {
                console.log(`TripMap: Geocoding request failed for POI "${poiName}"`);
              }
            } catch (error) {
              console.warn(`TripMap: Could not geocode POI: ${poiName}`, error);
            }
          }
        }
      }
      
      console.log(`TripMap: Identified ${poisFound} points of interest for ${location}`);

      // If we still don't have many POIs, try a more general search
      if (pois.length < 3) {
        // Get popular places in the location
        console.log(`TripMap: Not enough POIs found (${pois.length}), trying generic search`);
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
                console.log(`TripMap: Found ${data.length} generic locations for "${keyword} ${location}"`);
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
                    console.log(`TripMap: Added generic POI "${placeName}" (${type})`);
                  }
                }
              }
            }
            
            // If we found enough places, stop searching
            if (pois.length >= 5) {
              console.log(`TripMap: Found enough POIs (${pois.length}), stopping generic search`);
              break;
            }
          } catch (error) {
            console.warn(`TripMap: Could not find generic POIs for ${location}`, error);
          }
        }
      }
    } catch (error) {
      console.error('TripMap: Error extracting POIs:', error);
    }
    
    console.log(`TripMap: Returning ${pois.length} POIs for ${location}`);
    return pois;
  };

  // Process trip data and geocode locations
  useEffect(() => {
    const fetchLocations = async () => {
      console.log("TripMap: Starting fetchLocations", { 
        location, 
        cities: Array.isArray(cities) ? cities : String(cities),
        dateRange,
        tripResultType: typeof tripResult,
        tripResultLength: tripResult ? (typeof tripResult === 'string' ? tripResult.length : 'JSON object') : 'undefined'
      });
      
      try {
        setIsLoading(true);
        setError(null);

        // Normalize cities to array
        const citiesArray = Array.isArray(cities) 
          ? cities 
          : typeof cities === 'string' ? cities.split(',').map(city => city.trim()) : [];
        
        console.log("TripMap: Normalized cities:", citiesArray);
        
        // Combine location and cities
        const allLocations = [location, ...citiesArray].filter(loc => loc && loc.trim() !== '');
        console.log("TripMap: All locations to process:", allLocations);
        
        if (allLocations.length === 0) {
          console.log("TripMap: No locations to display");
          setIsLoading(false);
          setError("No locations to display");
          return;
        }

        // Convert the trip result to a string if it's not already
        const tripResultText = typeof tripResult === 'string' 
          ? tripResult 
          : JSON.stringify(tripResult);
        
        console.log(`TripMap: Trip result text length: ${tripResultText.length} characters`);

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
              
              // Find day information from tripResult
              let day: number | undefined = undefined;
              if (tripResultText && i > 0) {
                const dayMatch = tripResultText.match(new RegExp(`Day (\\d+):[^]*?\\b${loc}\\b`, 'i'));
                if (dayMatch && dayMatch[1]) {
                  day = parseInt(dayMatch[1], 10);
                  console.log(`TripMap: Found day ${day} for location ${loc}`);
                }
              }
              
              // Extract activities and description from trip result
              console.log(`TripMap: Extracting points of interest for ${loc}`);
              const activities = tripResultText ? 
                await extractPointsOfInterest(tripResultText, loc) : 
                [];
              
              console.log(`TripMap: Found ${activities.length} points of interest for ${loc}`);
              
              // Get a brief description for the location
              let description = '';
              if (tripResultText) {
                const locationRegex = new RegExp(`\\b${loc}\\b[^.]*\\.`);
                const match = tripResultText.match(locationRegex);
                if (match) {
                  description = match[0].trim();
                  console.log(`TripMap: Found description for ${loc}: "${description}"`);
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
              console.error(`TripMap: Error geocoding ${loc}:`, err);
            }
          }
          
          return results;
        };
        
        const locationData = await processWithDelay(allLocations);
        console.log("TripMap: Processed location data", locationData);
        
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
          console.log(`TripMap: Set map center to single location: ${locationData[0].lat},${locationData[0].lng}, zoom: 10`);
        } else {
          // Find bounds to include all locations
          const minLat = Math.min(...locationData.map(loc => loc.lat));
          const maxLat = Math.max(...locationData.map(loc => loc.lat));
          const minLng = Math.min(...locationData.map(loc => loc.lng));
          const maxLng = Math.max(...locationData.map(loc => loc.lng));
          
          // Center is the average
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          setMapCenter([centerLat, centerLng]);
          
          // Set zoom based on the distance between points
          const latDiff = maxLat - minLat;
          const lngDiff = maxLng - minLng;
          const maxDiff = Math.max(latDiff, lngDiff);
          
          let newZoom = 8;
          // Adjust zoom level based on the distance
          if (maxDiff > 20) newZoom = 3;
          else if (maxDiff > 10) newZoom = 4;
          else if (maxDiff > 5) newZoom = 5;
          else if (maxDiff > 1) newZoom = 6;
          else if (maxDiff > 0.5) newZoom = 7;
          
          setMapZoom(newZoom);
          console.log(`TripMap: Set map center for multiple locations: ${centerLat},${centerLng}, zoom: ${newZoom}`);
        }
        
        console.log("TripMap: Completed fetch locations process");
        setIsLoading(false);
      } catch (err) {
        console.error('TripMap: Error setting up map:', err);
        setError('Failed to load map data: ' + (err instanceof Error ? err.message : String(err)));
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [location, cities, tripResult]);

  // Handle location selection with deeper street-level zoom
  const handleLocationClick = (loc: LocationData) => {
    console.log(`TripMap: Entering detail mode for ${loc.name}`);
    setSelectedLocation(loc);
    setDetailMode(true);
    setMapCenter([loc.lat, loc.lng]);
    setMapZoom(17); // Set to 17 for street-level details
    setSelectedDay(null); // Reset day filter when changing location
  };

  // Return to overview mode
  const handleBackToOverview = () => {
    console.log("TripMap: Returning to overview mode");
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

  // Fallback content with hardcoded data for testing
  const renderFallbackMap = () => {
    console.log("TripMap: Rendering fallback map");
    return (
      <div className="flex flex-col items-center justify-center h-full bg-yellow-50 p-4">
        <p className="text-amber-600 font-medium mb-2">⚠️ Using fallback map</p>
        <p className="text-gray-700 mb-4">Map is displaying hardcoded test data instead of real locations.</p>
        <Button 
          onClick={() => setIsLoading(true)} 
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          Try Loading Real Data Again
        </Button>
      </div>
    );
  };

  // Add a simple function to test if the map is actually rendering
  const useFallbackData = () => {
    if (error && mapLocations.length === 0) {
      console.log("TripMap: Setting fallback test data");
      // Kolkata and Dubai coordinates as test data
      setMapLocations([
        {
          name: "Test Location",
          lat: 22.5726,
          lng: 88.3639,
          isStart: true,
          isEnd: false,
          description: "Test location description"
        },
        {
          name: "Test Destination",
          lat: 25.2048,
          lng: 55.2708,
          isStart: false,
          isEnd: true,
          description: "Test destination description"
        }
      ]);
      setMapCenter([(22.5726 + 25.2048) / 2, (88.3639 + 55.2708) / 2]);
      setMapZoom(4);
      setError("Using test data - real data failed to load");
      return true;
    }
    return false;
  };

  // Check if we should use fallback data
  const isFallback = useFallbackData();

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
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mb-4" />
              <span className="text-gray-600 dark:text-gray-300">Loading map data...</span>
              
              {/* Add debugging info */}
              <div className="mt-4 text-xs text-left max-w-md p-2">
                <p className="text-gray-500">Debug info:</p>
                <p className="text-gray-500">Location: {location || "none"}</p>
                <p className="text-gray-500">Cities: {Array.isArray(cities) ? cities.join(", ") : (cities || "none")}</p>
                <p className="text-gray-500">Date range: {dateRange || "none"}</p>
                {error && <p className="text-red-500 font-bold mt-2">Error: {error}</p>}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full bg-red-50 dark:bg-red-900/20 p-4">
              <div className="text-red-500 dark:text-red-400 text-center mb-4">
                <p>{error}</p>
              </div>
              {isFallback ? (
                renderFallbackMap()
              ) : (
                <Button 
                  onClick={() => setIsLoading(true)} 
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  Try Again
                </Button>
              )}
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
              
              {/* Wrap MapContainer in a try-catch to handle rendering errors */}
              {(() => {
                try {
                  console.log("TripMap: Rendering MapContainer", { mapCenter, mapZoom });
                  return (
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
                  );
                } catch (e) {
                  console.error("TripMap: Error rendering MapContainer:", e);
                  return (
                    <div className="flex items-center justify-center h-full bg-red-50">
                      <div className="text-center p-4">
                        <p className="text-red-500 mb-2">Map rendering error: {e instanceof Error ? e.message : String(e)}</p>
                        <Button 
                          onClick={() => setIsLoading(true)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  );
                }
              })()}
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
        
        {/* Add debugging footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-400">
          <details>
            <summary className="cursor-pointer">Map Debug Info</summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-left">
              <p>Map Status: {isLoading ? 'Loading' : (error ? 'Error' : 'Loaded')}</p>
              <p>Locations: {mapLocations.length}</p>
              <p>Center: {mapCenter.join(', ')}</p>
              <p>Zoom: {mapZoom}</p>
              <p>Days: {numberOfDays}</p>
              <p>Detail Mode: {detailMode ? 'Yes' : 'No'}</p>
              {error && <p className="text-red-500">Error: {error}</p>}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default TripMap;