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

const ProfessionalTripView = ({ tripData }: TripViewProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tripData) {
      setIsLoading(false);
    }
  }, [tripData]);

  // Enhanced parsing function that handles additional sections
  const parseContent = (content: string) => {
    if (!content) return { overview: [], days: [], additionalSections: {} };

    // Define section titles to extract
    const sectionTitles = [
      "Accommodation Options",
      "Logistics Options", 
      "Detailed Budget Breakdown",
      "Real-Time Flight Pricing",
      "Restaurant Reservations",
      "Weather Forecast and Packing Suggestions"
    ];
    
    // First extract the main itinerary parts (overview and days)
    const parts = content.split(/Day \d+:/);
    const overview = parts[0]?.trim().split('.').filter(p => p.trim()) || [];
    
    const days = [];
    for (let i = 1; i < parts.length; i++) {
      // Only use content up to any known section title
      let dayContent = parts[i];
      for (const title of sectionTitles) {
        const titleIndex = dayContent.indexOf(title);
        if (titleIndex > -1) {
          dayContent = dayContent.substring(0, titleIndex);
        }
      }
      
      const activities = dayContent
        .split('.')
        .map(a => a.trim())
        .filter(a => a.length > 0);
      
      days.push({
        date: `Day ${i}`,
        activities
      });
    }
    
    // Now extract the additional sections
    const additionalSections = {};
    
    for (const title of sectionTitles) {
      // Create a regex to extract each section, stopping at the next section or end
      const pattern = new RegExp(`${title}([\\s\\S]*?)(?=${sectionTitles.filter(t => t !== title).join('|')}|Day \\d+:|$)`, 'i');
      const match = content.match(pattern);
      
      if (match && match[1] && match[1].trim().length > 0) {
        // Format the section content into bullet points
        const sectionContent = match[1].trim();
        const points = sectionContent
          .split(/\n|\.|•/)
          .map(point => point.trim())
          .filter(point => point.length > 0);
          
        additionalSections[title] = points;
      }
    }
    
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
                {point}
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
                <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                  {day.activities.map((activity, actIndex) => (
                    <li key={actIndex} className="flex items-start">
                      <span className="text-cyan-500 mr-2">•</span>
                      {activity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Sections */}
      {Object.keys(additionalSections || {}).length > 0 && (
        <div className="p-8 mt-4 border-t dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">Additional Information</h2>
          <div className="space-y-6">
            {Object.entries(additionalSections).map(([title, points], index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
                <div className="bg-cyan-500 text-white p-4">
                  <h3 className="text-xl font-bold">{title}</h3>
                </div>
                <div className="p-6">
                  <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                    {Array.isArray(points) && points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start">
                        <span className="text-cyan-500 mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
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