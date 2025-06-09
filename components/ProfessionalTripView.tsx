"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "react-hot-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

interface AdditionalSections {
  accommodation: string;
  logistics: string;
  budget: string;
  flights: string;
  weather: string;
  restaurants: string;
}

const ProfessionalTripView: React.FC<TripViewProps> = ({ tripData }) => {
  const [loading, setLoading] = useState(false);
  const [intro, setIntro] = useState("");

    // ADD THIS DEBUG LOGGING RIGHT HERE
    useEffect(() => {
      console.log("=== PROFESSIONAL TRIP VIEW DEBUG ===");
      console.log("Raw tripData received:", tripData);
      console.log("tripData.location:", tripData?.location);
      console.log("tripData.cities:", tripData?.cities);
      console.log("tripData.dateRange:", tripData?.dateRange);
      console.log("tripData.interests:", tripData?.interests);
      console.log("tripData.jobId:", tripData?.jobId);
      console.log("tripData.tripResult:", tripData?.tripResult);
      console.log("tripData.tripResult type:", typeof tripData?.tripResult);
      console.log("====================================");
    }, [tripData]); 

  // Normalize cities and interests with better handling
  const cities = Array.isArray(tripData.cities) 
    ? tripData.cities 
    : (tripData.cities ? typeof tripData.cities === 'string' ? tripData.cities.split(',').map(city => city.trim()) : [] : []);
  
  const interests = Array.isArray(tripData.interests) 
    ? tripData.interests 
    : (tripData.interests ? typeof tripData.interests === 'string' ? tripData.interests.split(',').map(interest => interest.trim()) : [] : []);

  // Get the intro part of the itinerary
  useEffect(() => {
    if (tripData.tripResult) {
      const text = typeof tripData.tripResult === 'string' ? tripData.tripResult : JSON.stringify(tripData.tripResult);
      const introPart = text.split(/Day 1:/)[0].trim();
      setIntro(introPart);
    }
  }, [tripData.tripResult]);

  // Better parsing of itinerary
  const parseItinerary = (text: string) => {
    try {
      // First try to parse as JSON
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // If not JSON, try to parse as text
      const mainContent = text.split(/Day 1:/)[1];
      if (!mainContent) return [];
      
      const days = ("Day 1:" + mainContent).split(/Day \d+:/).slice(1).map(day => day.trim());
      return days.length > 0 ? days : [text]; // Return the whole text if no days found
    }
    return [];
  };

  const itineraryData = typeof tripData.tripResult === 'string' 
    ? parseItinerary(tripData.tripResult)
    : tripData.tripResult;

  // Format the itinerary data for display
  const formatItineraryDay = (day: any, index: number) => {
    if (typeof day === 'string') {
      return day;
    }
    if (typeof day === 'object') {
      return Object.entries(day)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    }
    return `Day ${index + 1} activities`;
  };

  // Extract additional sections from the itinerary
  const extractSections = (text: string): AdditionalSections => {
    const sections: AdditionalSections = {
      accommodation: '',
      logistics: '',
      budget: '',
      flights: '',
      weather: '',
      restaurants: ''
    };

    // Extract accommodation section
    const accomMatch = text.match(/Accommodation Options[^]*?(?=Logistics|$)/i);
    if (accomMatch) sections.accommodation = accomMatch[0].trim();

    // Extract logistics section
    const logisticsMatch = text.match(/Logistics Options[^]*?(?=Budget|$)/i);
    if (logisticsMatch) sections.logistics = logisticsMatch[0].trim();

    // Extract budget section
    const budgetMatch = text.match(/Budget Breakdown[^]*?(?=Weather|$)/i);
    if (budgetMatch) sections.budget = budgetMatch[0].trim();

    // Extract flight section
    const flightMatch = text.match(/Real-Time Flight[^]*?(?=Restaurant|$)/i);
    if (flightMatch) sections.flights = flightMatch[0].trim();

    // Extract weather section
    const weatherMatch = text.match(/Weather Forecast[^]*?(?=Restaurant|$)/i);
    if (weatherMatch) sections.weather = weatherMatch[0].trim();

    // Extract restaurant section
    const restaurantMatch = text.match(/Restaurant Reservations[^]*?(?=Enjoy|$)/i);
    if (restaurantMatch) sections.restaurants = restaurantMatch[0].trim();

    return sections;
  };

  const additionalSections: AdditionalSections = typeof tripData.tripResult === 'string' 
    ? extractSections(tripData.tripResult)
    : {
        accommodation: '',
        logistics: '',
        budget: '',
        flights: '',
        weather: '',
        restaurants: ''
      };

  // Share handlers
  const handleShare = async (type: string) => {
    try {
      if (type === 'native' && navigator.share) {
        await navigator.share({
          title: `${tripData.location} Travel Itinerary`,
          text: `Check out my trip to ${tripData.location}!`,
          url: window.location.href
        });
        toast.success('Shared successfully!');
      } else if (type === 'copy') {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
      } else if (type === 'pdf') {
        const content = document.getElementById('trip-content');
        if (!content) {
          toast.error('Could not find content to export');
          return;
        }
        
        setLoading(true);
        toast.loading('Generating PDF...');
        
        try {
          // Use html2canvas for PDF generation
          const canvas = await html2canvas(content, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/png');
          
          // Calculate PDF dimensions to match content aspect ratio
          const imgWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          // Add image to PDF, handling multi-page content
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          
          // If content is longer than a page, add more pages
          let position = 0;
          const remainingHeight = imgHeight - pageHeight;
          
          if (remainingHeight > 0) {
            let page = 1;
            while (position < imgHeight) {
              position -= pageHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              page++;
            }
          }
          
          pdf.save(`${tripData.location}-itinerary.pdf`);
          toast.dismiss();
          toast.success('PDF downloaded!');
        } catch (err) {
          console.error('PDF generation error:', err);
          toast.dismiss();
          toast.error('Failed to generate PDF');
        }
        
        setLoading(false);
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.dismiss();
      toast.error('Failed to share');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Toaster />
      
      {/* PDF Export Container */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden" id="trip-content">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
          <h1 className="text-3xl font-bold mb-3">{tripData.location} Trip Itinerary</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span><strong>Cities:</strong> {cities.length > 0 ? cities.join(', ') : 'Not specified'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span><strong>Date Range:</strong> {tripData.dateRange || 'Not specified'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
              <span><strong>Interests:</strong> {interests.length > 0 ? interests.join(', ') : 'Not specified'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span><strong>Job ID:</strong> {tripData.jobId || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* Trip Intro */}
        {intro && (
          <div className="p-8 bg-blue-50">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Trip Overview</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {intro}
            </div>
          </div>
        )}

        {/* Itinerary Section */}
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Daily Itinerary</h2>
          {Array.isArray(itineraryData) && itineraryData.length > 0 ? (
            <div className="space-y-6">
              {itineraryData.map((day, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                      {i + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Day {i + 1}</h3>
                  </div>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {formatItineraryDay(day, i)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic bg-gray-50 p-4 rounded-lg text-center">
              {tripData.tripResult ? "Itinerary details couldn't be parsed into days." : "No itinerary details available."}
            </div>
          )}
        </div>

        {/* Additional Sections */}
        {(additionalSections.accommodation || additionalSections.logistics || additionalSections.budget || 
          additionalSections.flights || additionalSections.weather || additionalSections.restaurants) && (
          <div className="p-8 bg-gray-50">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Additional Information</h2>
            <div className="space-y-6">
              {additionalSections.accommodation && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Accommodation Options</h3>
                  <div className="text-gray-700 whitespace-pre-line">{additionalSections.accommodation.replace("Accommodation Options", "")}</div>
                </div>
              )}
              {additionalSections.logistics && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Logistics Options</h3>
                  <div className="text-gray-700 whitespace-pre-line">{additionalSections.logistics.replace("Logistics Options", "")}</div>
                </div>
              )}
              {additionalSections.budget && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Budget Breakdown</h3>
                  <div className="text-gray-700 whitespace-pre-line">{additionalSections.budget.replace("Budget Breakdown", "")}</div>
                </div>
              )}
              {additionalSections.flights && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Flight Information</h3>
                  <div className="text-gray-700 whitespace-pre-line">{additionalSections.flights.replace("Real-Time Flight", "")}</div>
                </div>
              )}
              {additionalSections.weather && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Weather & Packing</h3>
                  <div className="text-gray-700 whitespace-pre-line">{additionalSections.weather.replace("Weather Forecast", "")}</div>
                </div>
              )}
              {additionalSections.restaurants && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Restaurant Reservations</h3>
                  <div className="text-gray-700 whitespace-pre-line">{additionalSections.restaurants.replace("Restaurant Reservations", "")}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw Itinerary If Needed */}
        {(!Array.isArray(itineraryData) || itineraryData.length === 0) && tripData.tripResult && !intro && (
          <div className="p-8 border-t">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Full Itinerary</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {typeof tripData.tripResult === 'string' ? tripData.tripResult : JSON.stringify(tripData.tripResult, null, 2)}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-100 p-6 text-center text-gray-600 text-sm">
          <p>Created with Quipit Travel Planner</p>
          <p className="mt-1">© {new Date().getFullYear()} Quipit - All Rights Reserved</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white px-8 py-4 border-b rounded-lg shadow-md mt-4 mb-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {typeof navigator.share === "function" && (
            <Button 
              onClick={() => handleShare('native')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
              </svg>
              <span>Share</span>
            </Button>
          )}
          <Button 
            onClick={() => handleShare('copy')}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
            </svg>
            <span>Copy Link</span>
          </Button>
          <Button 
            onClick={() => handleShare('pdf')}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>{loading ? 'Generating...' : 'Download PDF'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalTripView;