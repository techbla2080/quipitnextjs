'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane } from "lucide-react";

const TravelPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-12">
        {/* Logo Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Quipit</h1>
          <h2 className="text-xl text-gray-800 dark:text-gray-200">
            AI that <span className="text-blue-600">Works for You!</span>
          </h2>
        </div>

        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-6 flex justify-center">
            <Plane className="w-16 h-16 text-blue-500" />
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-4">
            Your Dream Trip Planned Instantly
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Let Quipit's AI create your perfect itinerary. Just tell us your destination and interests – 
            we'll handle all the research and planning for you.
          </p>

          <Card className="p-4 sm:p-8 mb-8 bg-white dark:bg-gray-800 shadow-lg">
            <div className="space-y-6">
              <div className="flex items-center space-x-4 text-left">
                <span className="w-8 h-8 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-semibold">1</span>
                <span className="text-lg text-gray-900 dark:text-white">Enter your destination</span>
              </div>
              <div className="flex items-center space-x-4 text-left">
                <span className="w-8 h-8 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-semibold">2</span>
                <span className="text-lg text-gray-900 dark:text-white">Set your dates & interests</span>
              </div>
              <div className="flex items-center space-x-4 text-left">
                <span className="w-8 h-8 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-semibold">3</span>
                <span className="text-lg text-gray-900 dark:text-white">Get your perfect itinerary instantly</span>
              </div>
            </div>
          </Card>

          {/* Marketing Tagline */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              Just Quipit!
            </h2>
          </div>

          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 h-auto"
            onClick={() => window.location.href = 'https://quipitnextjs.vercel.app/agents1'}
          >
            Plan My Trip Now
          </Button>

          {/* Promotional Preview */}
          <div className="mt-12 bg-blue-50 rounded-xl p-8 border-2 border-blue-100">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Here&apos;s What You&apos;ll Get</h3>
              <p className="text-gray-600">A professionally crafted itinerary like this:</p>
            </div>

            {/* Sample Itinerary Preview */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {/* Header */}
              <div className="text-center mb-6 pb-4 border-b">
                <div className="text-xl font-bold text-gray-800">London Adventure</div>
                <div className="text-gray-600">June 15 - June 20, 2024</div>
              </div>

              {/* Sample Day */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg flex flex-col items-center justify-center">
                  <h4 className="text-xl font-bold text-gray-800">DAY 1</h4>
                  <p className="text-sm text-gray-600">Thursday, June 15</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg col-span-2">
                  <p className="text-gray-800">
                    Morning: Visit Tower of London<br/>
                    Afternoon: Thames River Cruise<br/>
                    Evening: West End Show
                  </p>
                </div>
              </div>

              {/* Blur Overlay */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50">
                  <div className="bg-blue-50 p-4 rounded-lg flex flex-col items-center justify-center">
                    <h4 className="text-xl font-bold text-gray-800">DAY 2</h4>
                    <p className="text-sm text-gray-600">Friday, June 16</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg col-span-2">
                    <p className="text-gray-800">Content blurred...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="text-blue-600 font-bold mb-2">Daily Breakdown</div>
                <p className="text-sm text-gray-600">Detailed day-by-day itinerary with timings</p>
              </div>
              <div className="text-center p-4">
                <div className="text-blue-600 font-bold mb-2">Local Insights</div>
                <p className="text-sm text-gray-600">Hidden gems and local recommendations</p>
              </div>
              <div className="text-center p-4">
                <div className="text-blue-600 font-bold mb-2">Smart Planning</div>
                <p className="text-sm text-gray-600">Optimized routes and timing</p>
              </div>
            </div>
          </div>

          {/* Promotional Preview */}
          <div className="mt-12 bg-blue-50 rounded-xl p-8 border-2 border-blue-100">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Here's What You'll Get</h3>
              <p className="text-gray-600">A professionally crafted itinerary like this:</p>
            </div>

            {/* Sample Itinerary Preview */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {/* Header */}
              <div className="text-center mb-6 pb-4 border-b">
                <div className="text-xl font-bold text-gray-800">London Adventure</div>
                <div className="text-gray-600">June 15 - June 20, 2024</div>
              </div>

              {/* Sample Day */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg flex flex-col items-center justify-center">
                  <h4 className="text-xl font-bold text-gray-800">DAY 1</h4>
                  <p className="text-sm text-gray-600">Thursday, June 15</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg col-span-2">
                  <p className="text-gray-800">
                    Morning: Visit Tower of London<br/>
                    Afternoon: Thames River Cruise<br/>
                    Evening: West End Show
                  </p>
                </div>
              </div>

              {/* Blur Overlay */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50">
                  <div className="bg-blue-50 p-4 rounded-lg flex flex-col items-center justify-center">
                    <h4 className="text-xl font-bold text-gray-800">DAY 2</h4>
                    <p className="text-sm text-gray-600">Friday, June 16</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg col-span-2">
                    <p className="text-gray-800">Content blurred...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="text-blue-600 font-bold mb-2">Daily Breakdown</div>
                <p className="text-sm text-gray-600">Detailed day-by-day itinerary with timings</p>
              </div>
              <div className="text-center p-4">
                <div className="text-blue-600 font-bold mb-2">Local Insights</div>
                <p className="text-sm text-gray-600">Hidden gems and local recommendations</p>
              </div>
              <div className="text-center p-4">
                <div className="text-blue-600 font-bold mb-2">Smart Planning</div>
                <p className="text-sm text-gray-600">Optimized routes and timing</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-gray-300 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg text-white mb-4">Follow Us</h3>
              <ul className="space-y-2">
                <li><a href="https://www.facebook.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Facebook</a></li>
                <li><a href="https://www.facebook.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Instagram</a></li>
                <li><a href="https://www.facebook.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Twitter</a></li>
                <li><a href="https://www.facebook.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Youtube</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="https://www.facebook.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Privacy Policy</a></li>
                <li><a href="https://www.facebook.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Terms and Conditions</a></li>
                <li><a href="https://www.facebook.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Refund Policy</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg text-white mb-4">Call Us</h3>
              <p className="mb-2"><a href="https://www.facebook.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">1800 1238 1238</a></p>
              <p className="mb-4">Mon-Sat (9.30AM-6.30PM)</p>
              <h3 className="font-bold text-lg text-white mb-2">Write to us at:</h3>
              <p className="mb-1"><a href="https://www.facebook.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">customercare@quipit.com</a></p>
              <p className="mb-1">95A Park Street, Kolkata</p>
              <p>Kolkata 700016</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TravelPage;