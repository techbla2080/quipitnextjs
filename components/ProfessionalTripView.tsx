"use client";

import React, { useState, useEffect } from 'react';
import { Share, Download, Link2, FileText } from "lucide-react";
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

const ProfessionalTripView = ({ tripData }: TripViewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [parsedContent, setParsedContent] = useState<ParsedContent>({
    intro: '',
    days: [],
    additionalSections: {}
  });

  // Normalize tripData to ensure consistent format
  const normalizedTripData = {
    ...tripData,
    cities: Array.isArray(tripData.cities) ? tripData.cities : [tripData.cities],
    interests: Array.isArray(tripData.interests) ? tripData.interests : [tripData.interests]
  };

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
    if (!content) return <p className="text-gray-500 italic">Details will be added soon.</p>;
    
    const points = extractBulletPoints(content);
    
    if (points.length === 0) {
      // Try to display the content as is, if it has some substance
      return content.length > 10 ? (
        <p className="text-gray-600 dark:text-gray-300">
          <LinkText text={content} />
        </p>
      ) : (
        <p className="text-gray-500 italic">Details will be added soon.</p>
      );
    }
    
    return (
      <ul className="space-y-4 text-gray-600 dark:text-gray-300">
        {points.map((point, index) => (
          <li key={index} className="flex items-start">
            <span className="text-cyan-500 mr-2">•</span>
            <div className="flex-1">
              <LinkText text={point} />
            </div>
          </li>
        ))}
      </ul>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your trip details...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl mx-auto trip-content">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6 pb-16 rounded-t-lg relative overflow-hidden">
        <div className="absolute top-4 right-4 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 p-0"
              >
                <Share className="h-5 w-5 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <DropdownMenuItem onClick={() => handleShare('native')}>
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleShare('copy')}>
                <Link2 className="mr-2 h-4 w-4" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                Save as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          {/* Quipit Branding */}
          <div className="text-center text-white mb-6">
            <h2 className="text-2xl font-semibold mb-1">TRAVELOGUE</h2>
            <p className="text-sm mb-1">AI that works for you</p>
            <p className="text-xs italic">Just Quipit!</p>
          </div>

          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-center text-white">
            <h1 className="text-3xl font-medium mb-2">Travel Itinerary</h1>
            <div className="text-lg opacity-90 mb-2">
              {normalizedTripData.location} 
              {normalizedTripData.cities.length > 0 && ` → ${normalizedTripData.cities.join(" → ")}`}
            </div>
            <div className="text-base opacity-75">{normalizedTripData.dateRange}</div>
            {normalizedTripData.interests.length > 0 && (
              <div className="text-sm opacity-75 mt-2">
                Interests: {normalizedTripData.interests.join(", ")}
              </div>
            )}
            <div className="text-sm opacity-75 mt-1">Job ID: {normalizedTripData.jobId}</div>
          </div>
        </div>
      </div>

      {/* Trip Summary Cards */}
      <div className="px-8 -mt-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
            <div className="text-cyan-500 mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Destination</h3>
            <p className="text-lg font-semibold dark:text-white">{normalizedTripData.location}</p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
            <div className="text-cyan-500 mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Duration</h3>
            <p className="text-lg font-semibold dark:text-white">{normalizedTripData.dateRange}</p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
            <div className="text-cyan-500 mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Interests</h3>
            <p className="text-lg font-semibold dark:text-white">
              {normalizedTripData.interests.join(", ") || "Not specified"}
            </p>
          </div>
        </div>
      </div>

      <TripMap
    location={normalizedTripData.location}
    cities={normalizedTripData.cities}
    dateRange={normalizedTripData.dateRange}
    tripResult={tripData.tripResult}
  />

      {/* Trip Overview */}
      {parsedContent.intro && (
        <div className="p-8 mt-4">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">Trip Overview</h2>
          <div className="bg-cyan-50 dark:bg-gray-700/50 rounded-lg p-6">
            {createBulletList(parsedContent.intro)}
          </div>
        </div>
      )}

      {/* Daily Itinerary */}
      <div className="p-8 mt-4 border-t dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Daily Itinerary</h2>
        <div className="space-y-6">
          {Array.from({ length: numberOfDays }).map((_, index) => {
            const dayContent = parsedContent.days[index] || '';
            const dayHeader = dayContent.match(/Day \d+:/)?.[0] || `Day ${index + 1}:`;
            const dayDetails = dayContent.replace(dayHeader, '').trim();
            
            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-cyan-50 dark:bg-gray-700/50 p-6 rounded-lg flex flex-col items-center justify-center">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">DAY {index + 1}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{getDayDate(index)}</p>
                </div>
                <div className="bg-cyan-50 dark:bg-gray-700/50 p-6 rounded-lg col-span-2">
                  <h4 className="font-bold mb-4 dark:text-white">Activities:</h4>
                  <div className="space-y-2">
                    {createBulletList(dayDetails)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Sections */}
      <div className="p-8 mt-4 border-t dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Additional Information</h2>
        <div className="space-y-6">
          {/* Accommodation Options */}
          {parsedContent.additionalSections.accommodationOptions && (
            <div className="bg-cyan-50 dark:bg-gray-700/50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Accommodation Options
              </h3>
              <div className="space-y-2">
                {createBulletList(parsedContent.additionalSections.accommodationOptions)}
              </div>
            </div>
          )}

          {/* Logistics Options */}
          {parsedContent.additionalSections.logisticsOptions && (
            <div className="bg-cyan-50 dark:bg-gray-700/50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Logistics Options
              </h3>
              <div className="space-y-2">
                {createBulletList(parsedContent.additionalSections.logisticsOptions)}
              </div>
            </div>
          )}

          {/* Budget Breakdown */}
          {parsedContent.additionalSections.budgetBreakdown && (
            <div className="bg-cyan-50 dark:bg-gray-700/50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Detailed Budget Breakdown
              </h3>
              <div className="space-y-2">
                {createBulletList(parsedContent.additionalSections.budgetBreakdown)}
              </div>
            </div>
          )}

          {/* Flight Pricing */}
          {parsedContent.additionalSections.flightPricing && (
            <div className="bg-cyan-50 dark:bg-gray-700/50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Real-Time Flight Pricing
              </h3>
              <div className="space-y-2">
                {createBulletList(parsedContent.additionalSections.flightPricing)}
              </div>
            </div>
          )}

          {/* Restaurant Reservations */}
          {parsedContent.additionalSections.restaurantReservations && (
            <div className="bg-cyan-50 dark:bg-gray-700/50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Restaurant Reservations
              </h3>
              <div className="space-y-2">
                {createBulletList(parsedContent.additionalSections.restaurantReservations)}
              </div>
            </div>
          )}

          {/* Weather Forecast */}
          {parsedContent.additionalSections.weatherForecast && (
            <div className="bg-cyan-50 dark:bg-gray-700/50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Weather Forecast and Packing Suggestions
              </h3>
              <div className="space-y-2">
                {createBulletList(parsedContent.additionalSections.weatherForecast)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 mt-4 border-t dark:border-gray-700">
</div>

      {/* Footer */}
      <div className="border-t dark:border-gray-700 p-6 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          <p className="text-center sm:text-left">www.quipit.com</p>
          <p className="text-center">greenvalleymotor@gmail.com</p>
          <p className="text-center sm:text-right">+919830016577</p>
        </div>
      </div>
    </div>
  );
}

export default ProfessionalTripView;