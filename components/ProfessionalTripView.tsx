"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Share, Download, Link2, FileText, MapPin, Calendar, Globe, Clock, Navigation, 
  Sparkles, Flame, Music, Star, Heart, Radio, Lightbulb, Compass, Layers, Sun, Cloud, 
  Wind, Droplets, Menu, Zap, Users, Map as MapIcon, List, ChevronRight, ChevronDown, Plus, 
  Search, Camera, Coffee, Utensils, Building, Hotel, X, Moon as MoonIcon, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import TripMap from "@/components/TripMap";
import { motion, AnimatePresence } from "framer-motion";

// Helper components (defined at the top to avoid reference errors)
const Check = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const MoonSvg = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

// Create a LinkText component to handle clickable links
const LinkText = ({ text }: { text: string }) => {
  // First process markdown links
  const processMarkdownLinks = (content: string) => {
    const parts = content.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const [_, text, url] = match;
        return (
          <a 
            key={i} 
            href={url} 
            className="text-cyan-500 hover:underline" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {text}
          </a>
        );
      }
      return part;
    });
  };

  // Then process plain URLs in the remaining text
  const processUrls = (content: React.ReactNode[]) => {
    return content.map((part) => {
      if (typeof part !== 'string') return part;
      
      // Improved URL regex to catch more complete URLs
      const urlRegex = /https?:\/\/[^\s)]+(?:\.[^\s)]+)*/g;
      const parts = part.split(urlRegex);
      const matches = part.match(urlRegex) || [];
      
      return parts.map((text, i) => {
        return (
          <React.Fragment key={i}>
            {text}
            {matches[i] && (
              <a 
                href={matches[i]} 
                className="text-cyan-500 hover:underline" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {matches[i]}
              </a>
            )}
          </React.Fragment>
        );
      });
    });
  };

  const markdownProcessed = processMarkdownLinks(text);
  const urlProcessed = processUrls(markdownProcessed);
  
  return <>{urlProcessed}</>;
};

interface TripViewProps {
  tripData: {
    location: string;
    cities: string[] | string;
    dateRange: string;
    interests: string[] | string;
    jobId: string;
    tripResult: string;
  }
}

// Define types for the parsed content
interface ParsedContent {
  intro: string;
  days: string[];
  additionalSections: {
    accommodationOptions?: string;
    logisticsOptions?: string;
    budgetBreakdown?: string;
    flightPricing?: string;
    restaurantReservations?: string;
    weatherForecast?: string;
  }
}

// Define types for experiences
interface Experience {
  name: string;
  description: string;
  image: string;
  time: string;
  location: string;
  rating: number;
  price?: string;
  discount?: string;
  status: 'confirmed' | 'upcoming' | 'suggested';
}

// City weather interface
interface CityWeather {
  city: string;
  temp: number;
  condition: string;
  icon: React.ReactNode;
  hourly: Array<{
    time: string;
    temp: number;
    icon: React.ReactNode;
  }>;
  details: {
    wind: number;
    humidity: number;
    clouds: number;
  };
}

const FuturisticProfessionalTripView = ({ tripData }: TripViewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [parsedContent, setParsedContent] = useState<ParsedContent>({
    intro: '',
    days: [],
    additionalSections: {}
  });
  
  // Animation and UI state
  const [animateMap, setAnimateMap] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [showExperience, setShowExperience] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [currentMode, setCurrentMode] = useState<'day' | 'night'>('day');
  const [visualizationLevel, setVisualizationLevel] = useState(1);
  const [activeDay, setActiveDay] = useState(0);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAssistantMessage, setShowAssistantMessage] = useState(false);
  const [assistantMessageType, setAssistantMessageType] = useState<'tip' | 'insight' | 'alert'>('tip');
  const [activeView, setActiveView] = useState<'overview' | 'immersive' | 'planning'>('overview');
  
  const mapRef = useRef(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Normalize tripData to ensure consistent format
  const normalizedTripData = {
    ...tripData,
    cities: Array.isArray(tripData.cities) ? tripData.cities : [tripData.cities],
    interests: Array.isArray(tripData.interests) ? tripData.interests : [tripData.interests]
  };

  // Destination experiences (mocked data based on the itinerary)
  const [experiences, setExperiences] = useState<Experience[]>([]);

  // Weather data (mocked based on the destination)
  const [weather, setWeather] = useState<CityWeather>({
    city: normalizedTripData.location,
    temp: 27,
    condition: "Sunny with light clouds",
    icon: <Sun className="text-yellow-300" />,
    hourly: [
      { time: 'Now', temp: 27, icon: <Sun className="text-yellow-300" /> },
      { time: '14:00', temp: 28, icon: <Sun className="text-yellow-300" /> },
      { time: '15:00', temp: 28, icon: <Sun className="text-yellow-300" /> },
      { time: '16:00', temp: 27, icon: <Cloud className="text-blue-300" /> },
      { time: '17:00', temp: 26, icon: <Cloud className="text-blue-300" /> },
      { time: '18:00', temp: 24, icon: <Sun className="text-yellow-300" /> },
    ],
    details: {
      wind: 12,
      humidity: 24,
      clouds: 10
    }
  });

  // Function definitions - define before use to avoid reference errors
  const showAITip = () => {
    const tipTypes = ['tip', 'insight', 'alert'];
    setAssistantMessageType(tipTypes[Math.floor(Math.random() * tipTypes.length)] as 'tip' | 'insight' | 'alert');
    setShowAssistantMessage(true);
    toast.success('AI assistant activated');
  };

  const toggleNightMode = () => {
    setCurrentMode(currentMode === 'day' ? 'night' : 'day');
    toast.success(`${currentMode === 'day' ? 'Night' : 'Day'} mode activated`);
  };

  // Animation sequence
  useEffect(() => {
    // Start animation sequence
    const timeout1 = setTimeout(() => setAnimateMap(true), 800);
    const timeout2 = setTimeout(() => setShowWeather(true), 1800);
    const timeout3 = setTimeout(() => setPulseEffect(true), 2500);
    const timeout4 = setTimeout(() => setShowAIAssistant(true), 3000);
    const timeout5 = setTimeout(() => setShowExperience(true), 3500);
    const timeout6 = setTimeout(() => setShowNotification(true), 4500);
    const timeout7 = setTimeout(() => setShowAssistantMessage(true), 6000);
    
    // Simulate map visualization level changes
    const mapInteractionInterval = setInterval(() => {
      const randomVisualization = Math.floor(Math.random() * 3) + 1;
      setVisualizationLevel(randomVisualization);
    }, 8000);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      clearTimeout(timeout5);
      clearTimeout(timeout6);
      clearTimeout(timeout7);
      clearInterval(mapInteractionInterval);
    };
  }, []);

  // Generate experiences from the parsed content
  useEffect(() => {
    if (parsedContent.days.length > 0) {
      const newExperiences: Experience[] = [];
      
      // Extract activity details from each day
      parsedContent.days.forEach((day, dayIndex) => {
        // Simple extraction of activities using basic patterns
        const activities = day.split(/\n|•|-/).filter(line => 
          line.trim().length > 10 && 
          !line.includes("Day") && 
          !line.trim().startsWith(":")
        );
        
        activities.forEach((activity, index) => {
          // Try to extract time and location
          const timeMatch = activity.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/);
          const locationMatch = activity.match(/at\s+([^\.]+)/);
          
          const name = activity.substring(0, 30).trim();
          
          newExperiences.push({
            name: name,
            description: activity.trim(),
            image: `/api/placeholder/${300 + index}/${200 + dayIndex}`,
            time: timeMatch ? timeMatch[0] : `Day ${dayIndex + 1}`,
            location: locationMatch ? locationMatch[1].trim() : normalizedTripData.location,
            rating: 4 + Math.random(),
            price: Math.random() > 0.5 ? `€${Math.floor(Math.random() * 50) + 10}` : undefined,
            discount: Math.random() > 0.7 ? `${Math.floor(Math.random() * 30) + 10}% off` : undefined,
            status: index === 0 ? 'confirmed' : (Math.random() > 0.5 ? 'upcoming' : 'suggested')
          });
        });
      });
      
      setExperiences(newExperiences.slice(0, 12)); // Limit to avoid too many
    }
  }, [parsedContent.days, normalizedTripData.location]);

  useEffect(() => {
    if (tripData) {
      parseItinerary();
      setIsLoading(false);
    }
  }, [tripData]);

  // Function to parse the itinerary in the same way as TripPlanner
  const parseItinerary = () => {
    try {
      // Ensure tripResult is a string
      const itineraryText = typeof tripData.tripResult === 'string' 
        ? tripData.tripResult 
        : JSON.stringify(tripData.tripResult);
      
      // First extract the intro (overview)
      let intro = '';
      let days: string[] = [];
      
      // Split by "Day X:" pattern to separate intro and daily content
      const parts = itineraryText.split(/Day \d+:/);
      
      if (parts.length > 0) {
        intro = parts[0].trim();
        
        // Extract each day's content
        const dayMatches = itineraryText.match(/Day \d+:[^]*?(?=Day \d+:|$)/g) || [];
        days = dayMatches.map(day => day.trim());
      }
      
      // Extract additional sections
      const additionalSections = {
        accommodationOptions: extractSection(
          itineraryText, 
          ["Accommodation Options", "Accommodation", "Hotels", "Places to Stay"]
        ),
        logisticsOptions: extractSection(
          itineraryText, 
          ["Logistics Options", "Logistics", "Transport", "Transportation", "Local Transport"]
        ),
        budgetBreakdown: extractSection(
          itineraryText, 
          ["Detailed Budget Breakdown", "Budget Breakdown", "Budget", "Expenses"]
        ),
        flightPricing: extractSection(
          itineraryText, 
          ["Real-Time Flight Pricing", "Flight Pricing", "Flights", "Airlines"]
        ),
        restaurantReservations: extractSection(
          itineraryText, 
          ["Restaurant Reservations", "Restaurants", "Dining", "Food", "Cafes"]
        ),
        weatherForecast: extractSection(
          itineraryText, 
          ["Weather Forecast and Packing Suggestions", "Weather Forecast", "Weather", "Packing"]
        )
      };
      
      setParsedContent({
        intro,
        days,
        additionalSections
      });
      
    } catch (error) {
      console.error("Error parsing itinerary:", error);
      toast.error("Error parsing your itinerary");
    }
  };
  
  // Helper function to extract a section by its possible titles
  const extractSection = (text: string, possibleTitles: string[]): string => {
    for (const title of possibleTitles) {
      const index = text.indexOf(title);
      if (index !== -1) {
        // Find the end of this section (next section or end of text)
        let endIndex = text.length;
        
        const commonSectionTitles = [
          "Accommodation Options",
          "Logistics Options",
          "Detailed Budget Breakdown",
          "Budget Breakdown",
          "Real-Time Flight Pricing",
          "Restaurant Reservations",
          "Weather Forecast",
          "Day 1:",
          "Day 2:",
          "Day 3:",
          "Day 4:",
          "Day 5:",
          "Day 6:",
          "Day 7:"
        ];
        
        for (const nextTitle of commonSectionTitles) {
          // Skip the current title
          if (nextTitle === title) continue;
          
          const nextIndex = text.indexOf(nextTitle, index + title.length);
          if (nextIndex !== -1 && nextIndex < endIndex) {
            endIndex = nextIndex;
          }
        }
        
        // Extract the section
        return text.substring(index, endIndex).trim();
      }
    }
    return '';
  };

  // Helper function to calculate date for a specific day in the itinerary
  const getDayDate = (dayIndex: number): string => {
    try {
      if (!tripData.dateRange) return `Day ${dayIndex + 1}`;
      
      const [startStr, endStr] = tripData.dateRange.split(" to ");
      
      const parseDate = (dateStr: string) => {
        const [month, day, year] = dateStr.split("/").map(num => parseInt(num, 10));
        return new Date(year, month - 1, day);
      };
      
      const startDate = parseDate(startStr);
      if (isNaN(startDate.getTime())) return `Day ${dayIndex + 1}`;
      
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayIndex);
      
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric"
      });
    } catch (error) {
      console.error("Error calculating date:", error);
      return `Day ${dayIndex + 1}`;
    }
  };

  const handleShare = async (type: string) => {
    try {
      const tripContent = document.querySelector('.trip-content');
      if (!tripContent) return;
  
      switch (type) {
        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: `${tripData.location} Travel Itinerary`,
              text: `Check out my trip to ${tripData.location}!`,
              url: window.location.href
            });
            toast.success('Shared successfully!');
          }
          break;
  
        case 'copy':
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link copied!');
          break;
  
        case 'pdf':
          const canvas = await html2canvas(tripContent as HTMLElement);
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
          });
          
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
          pdf.save(`${tripData.location}-itinerary.pdf`);
          toast.success('PDF downloaded!');
          break;
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share');
    }
  };

  // Helper function to extract bullet points from text
  const extractBulletPoints = (text: string): string[] => {
    if (!text) return [];
    
    // Try to split by common separators
    const lines = text.split(/(?:\r?\n|\r|•|-|\.|(?<=\.)\s+)/g)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    return lines;
  };

  // Helper function to create bullet list from content
  const createBulletList = (content: string | null | undefined): React.ReactNode => {
    if (!content) return <p className="text-gray-400 italic">Details will be added soon.</p>;
    
    const points = extractBulletPoints(content);
    
    if (points.length === 0) {
      // Try to display the content as is, if it has some substance
      return content.length > 10 ? (
        <p className="text-gray-300">
          <LinkText text={content} />
        </p>
      ) : (
        <p className="text-gray-400 italic">Details will be added soon.</p>
      );
    }
    
    return (
      <ul className="space-y-4 text-gray-300">
        {points.map((point, index) => (
          <motion.li 
            key={index} 
            className="flex items-start"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <span className="text-cyan-500 mr-2">•</span>
            <div className="flex-1">
              <LinkText text={point} />
            </div>
          </motion.li>
        ))}
      </ul>
    );
  };

  // Calculate the number of days in the trip
  const calculateNumberOfDays = (): number => {
    try {
      const [startStr, endStr] = tripData.dateRange.split(" to ");
      
      const parseDate = (dateStr: string) => {
        const [month, day, year] = dateStr.split("/").map(num => parseInt(num, 10));
        return new Date(year, month - 1, day);
      };
      
      const startDate = parseDate(startStr);
      const endDate = parseDate(endStr);
      
      const diffTime = endDate.getTime() - startDate.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } catch (error) {
      console.error("Error calculating days:", error);
      return parsedContent.days.length || 5; // Fallback to parsed days or default 5
    }
  };
  
  const numberOfDays = calculateNumberOfDays();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 relative mx-auto mb-8">
            <div className="absolute w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute w-16 h-16 border-4 border-purple-500 border-opacity-30 rounded-full"></div>
          </div>
          <motion.p 
            className="text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            Loading your futuristic travel experience...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen trip-content relative overflow-hidden">
      {/* Dynamic background based on time mode */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/30 via-transparent to-purple-900/20 z-0"></div>
      <div className={`fixed inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-emerald-500/10 z-0 transition-all duration-1000 ${animateMap ? 'opacity-100' : 'opacity-0'} ${currentMode === 'night' ? 'opacity-0' : ''}`}></div>
      <div className={`fixed inset-0 bg-gradient-to-tr from-blue-900/20 via-black/20 to-purple-900/10 z-0 transition-all duration-1000 ${currentMode === 'night' ? 'opacity-100' : 'opacity-0'}`}></div>
      
      {/* Aurora effect for night mode */}
      <div className={`fixed inset-0 z-0 overflow-hidden transition-opacity duration-1000 ${currentMode === 'night' ? 'opacity-40' : 'opacity-0'}`}>
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-teal-500/10 via-purple-500/5 to-transparent transform-gpu animate-aurora"></div>
      </div>
      
      {/* Smart grid overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`w-full h-full grid grid-cols-24 grid-rows-24 transition-opacity duration-1000 ${visualizationLevel === 3 ? 'opacity-30' : 'opacity-0'}`}>
          {Array.from({ length: 576 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-cyan-500/10"></div>
          ))}
        </div>
      </div>
      
      {/* Advanced particle effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div 
            key={i}
            className={`absolute rounded-full blur-sm ${i % 3 === 0 ? 'bg-cyan-500/30' : i % 3 === 1 ? 'bg-purple-500/20' : 'bg-blue-400/20'}`}
            style={{
              width: Math.random() * 12 + 2 + 'px',
              height: Math.random() * 12 + 2 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.6,
              filter: `blur(${Math.random() * 3 + 1}px)`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0]
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Star field for night mode */}
      <div className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${currentMode === 'night' ? 'opacity-100' : 'opacity-0'}`}>
        {Array.from({ length: 100 }).map((_, i) => (
          <motion.div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>
      
      {/* Notification bubble */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            className="fixed top-6 right-6 z-50"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center p-3 pr-5 backdrop-blur-xl bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-full border border-white/20 shadow-lg shadow-purple-500/20">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mr-3">
                <Flame className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium">Hot tip detected!</div>
                <div className="text-xs text-white/70">{normalizedTripData.location} tickets are 30% off today</div>
              </div>
              <button 
                className="ml-3 w-6 h-6 rounded-full bg-black/30 flex items-center justify-center"
                onClick={() => setShowNotification(false)}
              >
                <X className="h-3 w-3 text-white/70" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* AI Assistant floating button */}
      <AnimatePresence>
        {showAIAssistant && (
          <motion.div 
            className="fixed bottom-6 right-6 z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
          >
            <button 
              className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-lg shadow-purple-500/20 relative"
              onClick={showAITip}
            >
              <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-black ${pulseEffect ? 'animate-pulse' : ''}`}></span>
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* AI Assistant message */}
      <AnimatePresence>
        {showAssistantMessage && (
          <motion.div 
            className="fixed bottom-24 right-6 z-50 max-w-xs"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`p-4 rounded-lg backdrop-blur-xl shadow-lg ${
              assistantMessageType === 'tip' 
                ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-500/30' 
                : assistantMessageType === 'insight' 
                ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/30'
                : 'bg-gradient-to-br from-amber-500/30 to-red-500/30 border border-amber-500/30'
            }`}>
              <div className="flex items-start mb-3">
                <div className={`w-8 h-8 rounded-full mr-2 flex items-center justify-center ${
                  assistantMessageType === 'tip' 
                    ? 'bg-cyan-500' 
                    : assistantMessageType === 'insight'
                    ? 'bg-purple-500'
                    : 'bg-amber-500'
                }`}>
                  {assistantMessageType === 'tip' ? (
                    <Lightbulb className="h-4 w-4 text-white" />
                  ) : assistantMessageType === 'insight' ? (
                    <Star className="h-4 w-4 text-white" />
                  ) : (
                    <Flame className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {assistantMessageType === 'tip' 
                      ? 'Travel Tip' 
                      : assistantMessageType === 'insight'
                      ? 'Local Insight'
                      : 'Time-Sensitive Alert'}
                  </div>
                  <p className="text-sm text-white/80">
                    {assistantMessageType === 'tip' 
                      ? `Book your ${normalizedTripData.cities[0] || normalizedTripData.location} tours at least 3 days in advance to avoid last-minute price increases.` 
                      : assistantMessageType === 'insight'
                      ? `Locals recommend visiting ${normalizedTripData.cities[0] || normalizedTripData.location} attractions early in the morning to avoid crowds.`
                      : `Weather alert: Unexpected rain shower predicted tomorrow afternoon. Consider rescheduling outdoor activities.`}
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  className="px-3 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  onClick={() => setShowAssistantMessage(false)}
                >
                  Dismiss
                </button>
                <button 
                  className="px-3 py-1 text-xs rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  onClick={() => {
                    setShowAssistantMessage(false);
                    toast.success('Preference saved!');
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with advanced glass effect */}
      <motion.header 
        className="sticky top-0 z-30 backdrop-blur-xl bg-gradient-to-r from-black/40 via-black/30 to-black/40 border-b border-white/10 py-4 px-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        ref={headerRef}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Globe className="h-7 w-7 text-cyan-400" />
              <motion.div 
                className="absolute inset-0 text-cyan-400"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Globe className="h-7 w-7" />
              </motion.div>
            </div>
            <h1 className="text-2xl font-light tracking-widest">NOVA<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-bold">TREK</span></h1>
            <div className="ml-2 px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 text-xs border border-cyan-500/20">
              BETA
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            {/* View switcher */}
            <nav className="hidden md:flex bg-black/40 rounded-full backdrop-blur-xl p-1 border border-white/5">
              {[
                { name: 'overview', icon: <Layers className="h-4 w-4 mr-1" /> },
                { name: 'immersive', icon: <Compass className="h-4 w-4 mr-1" /> },
                { name: 'planning', icon: <Calendar className="h-4 w-4 mr-1" /> }
              ].map(view => (
                <button
                  key={view.name}
                  onClick={() => setActiveView(view.name as 'overview' | 'immersive' | 'planning')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center ${
                    activeView === view.name 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white shadow-sm shadow-cyan-500/20' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {view.icon}
                  {view.name.charAt(0).toUpperCase() + view.name.slice(1)}
                </button>
              ))}
            </nav>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(numberOfDays, 5) }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveDay(i)}
                  className={`px-3 py-1 rounded-lg text-sm ${activeDay === i 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30' 
                    : 'bg-black/30 text-white/70 border border-white/10 hover:bg-black/40'
                  }`}
                >
                  Day {i + 1}
                </button>
              ))}
              
              {numberOfDays > 5 && (
                <button className="w-9 h-9 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center text-white/70">
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.header>
      
      {/* Daily Timeline */}
      <div className="relative z-10 px-6 my-8">
        <motion.div 
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="backdrop-blur-xl bg-gradient-to-br from-black/40 to-black/20 rounded-xl border border-white/10 p-6 shadow-lg shadow-purple-500/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Day {activeDay + 1}</h3>
                <p className="text-white/60">{getDayDate(activeDay)}</p>
              </div>
              
              <div className="flex space-x-3">
                <button className="px-3 py-2 rounded-lg bg-white/5 text-white/80 text-sm hover:bg-white/10 transition-colors">
                  <span className="flex items-center">
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate
                  </span>
                </button>
                
                <button className="px-3 py-2 rounded-lg bg-white/5 text-white/80 text-sm hover:bg-white/10 transition-colors">
                  <span className="flex items-center">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Activity
                  </span>
                </button>
              </div>
            </div>
            
            {/* Timeline */}
            <div className="relative">
              {/* Timeline line with gradient */}
              <div className="absolute left-[16px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-cyan-500/50"></div>
              
              {parsedContent.days[activeDay] ? (
                <div className="space-y-6">
                  {/* Extract activities from day content */}
                  {extractBulletPoints(parsedContent.days[activeDay]).map((activity, i) => (
                    <motion.div 
                      key={i} 
                      className="flex items-start pl-9 relative"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                    >
                      {/* Timeline dot with gradients */}
                      <div className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 opacity-20"></div>
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                          {i < 2 ? (
                            <Check className="h-3 w-3 text-white" />
                          ) : i === 2 ? (
                            <Clock className="h-3 w-3 text-white" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                      </div>
                      
                      {/* Activity Content */}
                      <div className="flex-1 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm">
                        <div className="font-medium text-white mb-1">
                          {activity.length > 80 ? activity.substring(0, 80) + "..." : activity}
                        </div>
                        
                        <div className="flex items-center text-white/50 text-xs space-x-4">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{i === 0 ? "8:00 AM" : i === 1 ? "10:30 AM" : i === 2 ? "1:30 PM" : i === 3 ? "3:00 PM" : "5:30 PM"}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{normalizedTripData.location}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="pl-9 py-10 text-center text-white/50">
                  <p>Day {activeDay + 1} details are not available yet.</p>
                  <button className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 text-sm">
                    Generate with AI
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Call to Action */}
      <div className="relative z-10 px-6 mb-12">
        <motion.div 
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <div className="backdrop-blur-xl bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 rounded-xl border border-white/10 p-8 shadow-lg shadow-purple-500/10 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/80"></div>
              <div className="absolute inset-0 bg-[url('/api/placeholder/1000/400')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="text-sm text-cyan-400 font-medium mb-2">ENHANCE YOUR JOURNEY</div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to make this trip unforgettable?</h3>
                <p className="text-white/70">Let our AI generate personalized experiences based on your unique preferences.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={showAITip}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-transform hover:scale-105"
                >
                  <span className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    AI Recommendations
                  </span>
                </button>
                
                <button className="px-6 py-3 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors">
                  <span className="flex items-center">
                    <Share className="h-5 w-5 mr-2" />
                    Share This Trip
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/10 backdrop-blur-md bg-black/30">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center mb-4 md:mb-0">
              <Globe className="h-6 w-6 text-cyan-400 mr-2" />
              <h2 className="text-xl font-light tracking-widest">NOVA<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-bold">TREK</span></h2>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-white/70 hover:text-white transition-colors">Help</a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">About</a>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-500">
            <p className="text-center sm:text-left">www.quipit.com</p>
            <p className="text-center">greenvalleymotor@gmail.com</p>
            <p className="text-center sm:text-right">+919830016577</p>
          </div>
        </div>
      </div>
      
      {/* Animations/Styles */}
      <style jsx global>{`
        @keyframes aurora {
          0% { transform: translateX(-100%) translateY(0%); }
          100% { transform: translateX(100%) translateY(50%); }
        }
        
        .animate-aurora {
          animation: aurora 20s linear infinite;
        }
        
        .animate-float-slow {
          animation: float 15s ease-in-out infinite;
        }
        
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-10px) translateX(5px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        
        /* Custom scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .scrollbar-thumb-white\/10::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
        }
        
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default FuturisticProfessionalTripView;