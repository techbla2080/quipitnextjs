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
      
      const urlRegex = /https?:\/\/[^\s)]+/g;
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
    cities: string[];
    dateRange: string;
    interests: string[];
    jobId: string;
    tripResult: string;
  }
}

// Define types for the parsed content
interface ParsedContent {
  overview: string[];
  days: {
    date: string;
    activities: string[];
  }[];
  additionalSections: {[key: string]: string[]};
}

const ProfessionalTripView = ({ tripData }: TripViewProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tripData) {
      setIsLoading(false);
    }
  }, [tripData]);

  // Enhanced parsing function that handles additional sections
  const parseContent = (content: string): ParsedContent => {
    if (!content) return { overview: [], days: [], additionalSections: {} };

    console.log("Parsing trip content...");
    
    // Clean up the content to remove any potential artifacts
    content = content.replace(/```/g, "").trim();
    
    // Calculate actual number of days in trip from dateRange
    let tripDayCount = 5; // Default to 5 days if we can't parse the date range
    if (tripData.dateRange) {
      const dateRangeParts = tripData.dateRange.split(' to ');
      if (dateRangeParts.length === 2) {
        try {
          const startDate = new Date(dateRangeParts[0]);
          const endDate = new Date(dateRangeParts[1]);
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            tripDayCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
            console.log(`Trip duration: ${tripDayCount} days`);
          }
        } catch (e) {
          console.error("Error parsing date range", e);
        }
      }
    }
    
    // Define section titles to extract (and their common variations)
    const sectionTitleVariants: {[key: string]: string[]} = {
      "Accommodation Options": ["Accommodation Options", "Accommodation", "Hotels", "Places to Stay", "Hotel", "Residence"],
      "Logistics Options": ["Logistics Options", "Logistics", "Transport", "Flight", "Transportation", "Local Transport"],
      "Detailed Budget Breakdown": ["Detailed Budget Breakdown", "Budget Breakdown", "Budget", "Cost", "Expenses", "Total cost"],
      "Real-Time Flight Pricing": ["Real-Time Flight Pricing", "Flight Pricing", "Flights", "Airlines", "Air Arabia"],
      "Restaurant Reservations": ["Restaurant Reservations", "Restaurants", "Dining", "Food", "Cafes", "Dinner", "Lunch"],
      "Weather Forecast and Packing Suggestions": ["Weather Forecast and Packing Suggestions", "Weather Forecast", "Weather", "Packing", "Temperature", "Conditions", "Packing List"]
    };
    
    // Get flat list of all section titles for splitting day content
    const allSectionTitles = Object.values(sectionTitleVariants).flat();
    
    // First extract the main itinerary parts (overview and days)
    const initialParts = content.split(/Day \d+:/);
    const overview = initialParts[0]?.trim().split('.').filter(p => p.trim()) || [];
    
    // Extract all day parts from content including their headers
    const dayMatches = content.match(/Day \d+:[^]*?(?=Day \d+:|$)/g) || [];
    
    const days = [];
    // Only process valid trip days (1 to tripDayCount)
    for (let i = 1; i <= tripDayCount; i++) {
      // Find the corresponding day content
      const dayMatch = dayMatches.find(d => d.startsWith(`Day ${i}:`));
      
      if (dayMatch) {
        // Extract just the day content without the header
        let dayContent = dayMatch.substring(`Day ${i}:`.length);
        
        // Truncate content if it contains any section titles
        for (const title of allSectionTitles) {
          // Make sure we're not matching things like "Weather: Sunny" inside day content
          const titleRegex = new RegExp(`(?:^|\\n|\\s)(${title})\\s*[:][^\\n]*`, 'i');
          const match = dayContent.match(titleRegex);
          if (match && typeof match.index === 'number' && match.index > 20) {
            dayContent = dayContent.substring(0, match.index);
          }
        }
        
        // Clean up activities text
        const activities = dayContent
          .split(/\.|\n|-|•/)
          .map(a => a.trim())
          .filter(a => a.length > 5 && a.length < 300);  // reasonable length for activity
        
        days.push({
          date: `Day ${i}`,
          activities
        });
      } else {
        // If no content found for this day, add an empty day
        days.push({
          date: `Day ${i}`,
          activities: []
        });
      }
    }
    
    // Now extract the additional sections
    // Initialize with index signature explicitly to avoid TypeScript error
    const additionalSections: {[key: string]: string[]} = {};
    
    // First pass: extract sections that are properly formatted
    for (const [mainTitle, variants] of Object.entries(sectionTitleVariants)) {
      // Try each variant of the section title
      for (const variant of variants) {
        const escapedVariant = variant.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const sectionRegex = new RegExp(`(?:^|\\n|\\s)(${escapedVariant})\\s*[:][^]*?(?=(?:${allSectionTitles.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).filter(t => t !== escapedVariant).join('|')})|$)`, 'i');
        const match = content.match(sectionRegex);
        
        if (match && match[0] && match[0].length > variant.length + 10) {
          const sectionContent = match[0].substring(match[0].indexOf(':') + 1).trim();
          
          // Split section content into bullet points
          const points = sectionContent
            .split(/\.|\n|-|•/)
            .map(p => p.trim())
            .filter(p => p.length > 5 && p.length < 300 && !p.startsWith('Day'));
          
          if (points.length > 0) {
            additionalSections[mainTitle] = points;
            break; // Once we found this section, stop looking for variants
          }
        }
      }
    }
    
    // Second pass: look for section content mistakenly labeled as days beyond trip duration
    for (const [mainTitle, variants] of Object.entries(sectionTitleVariants)) {
      // Skip if we already found this section
      if (additionalSections[mainTitle] && additionalSections[mainTitle].length > 0) continue;
      
      // Look for section content in days beyond the trip duration
      const sectionPoints: string[] = [];
      
      // Check each day past the trip duration
      for (let i = tripDayCount + 1; i <= 20; i++) { // Check up to Day 20 to be safe
        const dayRegex = new RegExp(`Day ${i}:[^]*?(?=Day \\d+:|$)`, 'i');
        const dayMatch = content.match(dayRegex);
        
        if (dayMatch && dayMatch[0]) {
          const dayContent = dayMatch[0].substring(`Day ${i}:`.length).trim();
          
          // Check if this day content belongs to our section
          const belongsToSection = variants.some(variant => 
            dayContent.includes(variant) || 
            new RegExp(`${variant}\\s*[:\\n]`, 'i').test(dayContent)
          );
          
          if (belongsToSection) {
            // Extract points from this day content
            const points = dayContent
              .split(/\.|\n|-|•/)
              .map(p => p.trim())
              .filter(p => p.length > 5 && p.length < 300 && !p.startsWith('Day'));
            
            sectionPoints.push(...points);
          }
        }
      }
      
      // Also look for section content embedded in the main text
      for (const variant of variants) {
        const variantInText = content.indexOf(variant);
        if (variantInText >= 0) {
          // Extract content around this variant
          const surroundingText = content.substring(variantInText - 50 > 0 ? variantInText - 50 : 0, 
                                                   variantInText + 500 < content.length ? variantInText + 500 : content.length);
          
          // Extract points from this text
          const points = surroundingText
            .split(/\.|\n|-|•/)
            .map(p => p.trim())
            .filter(p => p.length > 5 && p.length < 300 && !p.startsWith('Day') && p.includes(variant));
          
          sectionPoints.push(...points);
        }
      }
      
      // If we found points, add them to the section
      if (sectionPoints.length > 0) {
        additionalSections[mainTitle] = sectionPoints;
      }
    }
    
    // Special handling for Weather Forecast section
    if (!additionalSections["Weather Forecast and Packing Suggestions"] || 
        additionalSections["Weather Forecast and Packing Suggestions"].length === 0) {
      // Look for weather info in the content
      const weatherPoints: string[] = [];
      
      // Look for temperature and condition patterns
      const tempRegex = /(?:High|Low)[\s:]*\d+°[FC]/g;
      const tempMatches = content.match(tempRegex) || [];
      
      if (tempMatches.length > 0) {
        // Extract sentences containing temperature info
        for (const tempMatch of tempMatches) {
          const tempIndex = content.indexOf(tempMatch);
          if (tempIndex >= 0) {
            // Get sentence containing this temperature
            const sentenceStart = content.lastIndexOf('.', tempIndex) + 1;
            const sentenceEnd = content.indexOf('.', tempIndex + tempMatch.length);
            if (sentenceEnd > sentenceStart) {
              const sentence = content.substring(sentenceStart, sentenceEnd).trim();
              if (sentence.length > 5 && !weatherPoints.includes(sentence)) {
                weatherPoints.push(sentence);
              }
            }
          }
        }
      }
      
      // Look for packing suggestions
      const packingRegex = /Packing(?:\s+List)?[:\s]([^]*?)(?=Day|\n\n|$)/i;
      const packingMatch = content.match(packingRegex);
      
      if (packingMatch && packingMatch[1]) {
        const packingContent = packingMatch[1].trim();
        const packingItems = packingContent
          .split(/\.|\n|-|•/)
          .map(p => p.trim())
          .filter(p => p.length > 5 && p.length < 300 && !p.startsWith('Day'));
        
        weatherPoints.push(...packingItems);
      }
      
      // Also extract weather info from day activities
      days.forEach(day => {
        const weatherActivities = day.activities.filter(activity => 
          /weather|temperature|conditions|high|low|packing|forecast|degrees|°[CF]|rain|sunny|cloudy/i.test(activity)
        );
        
        if (weatherActivities.length > 0) {
          // Add unique weather points
          weatherActivities.forEach(activity => {
            if (!weatherPoints.includes(activity)) {
              weatherPoints.push(activity);
            }
          });
          
          // Remove weather activities from day content
          day.activities = day.activities.filter(activity => 
            !weatherActivities.includes(activity)
          );
        }
      });
      
      // If we found weather points, add them to the section
      if (weatherPoints.length > 0) {
        additionalSections["Weather Forecast and Packing Suggestions"] = weatherPoints;
      }
    }
    
    // Get the full section list for console debugging
    console.log("Found sections:", Object.keys(additionalSections));
    console.log("Found days:", days.length);
    
    return { overview, days, additionalSections };
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

  const { overview, days, additionalSections } = parseContent(tripData.tripResult);

  // Fixed order of sections for display
  const orderedSections = [
    "Accommodation Options",
    "Logistics Options", 
    "Detailed Budget Breakdown",
    "Real-Time Flight Pricing",
    "Restaurant Reservations",
    "Weather Forecast and Packing Suggestions"
  ];

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
            <h2 className="text-2xl font-semibold mb-1">Quipit</h2>
            <p className="text-sm mb-1">AI that works for you</p>
            <p className="text-xs italic">Just Quipit!</p>
          </div>

          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="text-center text-white">
            <h1 className="text-3xl font-medium mb-2">Travel Itinerary</h1>
            <div className="text-lg opacity-90 mb-2">{tripData.location} → {tripData.cities.join(" → ")}</div>
            <div className="text-base opacity-75">{tripData.dateRange}</div>
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
            <p className="text-lg font-semibold dark:text-white">{tripData.location}</p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
            <div className="text-cyan-500 mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Duration</h3>
            <p className="text-lg font-semibold dark:text-white">{tripData.dateRange}</p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
            <div className="text-cyan-500 mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Interests</h3>
            <p className="text-lg font-semibold dark:text-white">{tripData.interests.join(", ")}</p>
          </div>
        </div>
      </div>

      {/* Trip Overview */}
      <div className="p-8 mt-4">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Trip Overview</h2>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
          <ul className="space-y-4 text-gray-600 dark:text-gray-300">
            {overview.map((point, index) => (
              <li key={index} className="flex items-start">
                <span className="text-cyan-500 mr-2">•</span>
                <div className="flex-1">
                  <LinkText text={point} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Daily Itinerary */}
      <div className="p-8 mt-4 border-t dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Daily Itinerary</h2>
        <div className="space-y-6">
          {days.map((day, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
              <div className="bg-cyan-500 text-white p-4">
                <h3 className="text-xl font-bold">{day.date}</h3>
              </div>
              <div className="p-6">
                {day.activities.length > 0 ? (
                  <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                    {day.activities.map((activity, actIndex) => (
                      <li key={actIndex} className="flex items-start">
                        <span className="text-cyan-500 mr-2">•</span>
                        <div className="flex-1">
                          <LinkText text={activity} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No activities planned for this day.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Sections - Using fixed order */}
      {Object.keys(additionalSections).length > 0 && (
        <div className="p-8 mt-4 border-t dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">Additional Information</h2>
          <div className="space-y-6">
            {orderedSections.map(title => {
              const points = additionalSections[title];
              if (!points || points.length === 0) return null;
              
              return (
                <div key={title} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
                  <div className="bg-cyan-500 text-white p-4">
                    <h3 className="text-xl font-bold">{title}</h3>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                      {points.map((point, pointIndex) => (
                        <li key={pointIndex} className="flex items-start">
                          <span className="text-cyan-500 mr-2">•</span>
                          <div className="flex-1">
                            <LinkText text={point} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reference Footer */}
      <div className="border-t dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800 rounded-b-lg mt-8">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Reference Number</p>
          <p className="font-mono text-lg text-cyan-600 dark:text-cyan-400">{tripData.jobId}</p>
        </div>
      </div>
    </div>
  );
}

export default ProfessionalTripView;