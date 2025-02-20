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
            Skip the endless research! Let Quipit's AI create your perfect itinerary. Just tell us where you want to go, 
            and get a perfect itinerary tailored to your interests.
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
            onClick={() => window.open('/agents1', '_blank')}
          >
            Plan My Trip Now
          </Button>
        </div>
      </main>

      {/* Footer */}
{/* Footer */}
<footer className="bg-gray-900 py-12 text-gray-300 mt-12">
  <div className="w-full max-w-screen-xl mx-auto px-4"> {/* Changed container class */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full"> {/* Added w-full */}
      {/* Follow Us Column */}
      <div className="w-full"> {/* Added w-full */}
        <h3 className="font-bold text-lg text-white mb-4">Follow Us</h3>
        <ul className="space-y-2">
          <li><a href="https://www.facebook.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Facebook</a></li>
          <li><a href="https://www.instagram.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Instagram</a></li>
          <li><a href="https://www.twitter.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Twitter</a></li>
          <li><a href="https://www.youtube.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Youtube</a></li>
        </ul>
      </div>

      {/* Rest of your footer content */}
      <div className="w-full">
        <h3 className="font-bold text-lg text-white mb-4">Legal</h3>
        <ul className="space-y-2">
          <li><a href="/privacy-policy" className="hover:text-blue-400">Privacy Policy</a></li>
          <li><a href="/terms" className="hover:text-blue-400">Terms and Conditions</a></li>
          <li><a href="/refund-policy" className="hover:text-blue-400">Refund Policy</a></li>
        </ul>
      </div>

      <div className="w-full">
        <h3 className="font-bold text-lg text-white mb-4">Call Us</h3>
        <p className="mb-2">+919830016577</p>
        <p className="mb-4">Mon-Sat (9.30AM-6.30PM)</p>
        <h3 className="font-bold text-lg text-white mb-2">Write to us at:</h3>
        <p className="mb-1">customercare@quipit.com</p>
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