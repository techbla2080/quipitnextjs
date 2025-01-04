import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const TravelPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          {/* Plane Icon */}
          <svg
            className="w-16 h-16 mx-auto mb-8 text-blue-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21.5 16c.6 0 1-.4 1-1s-.4-1-1-1h-2.3l-3.4-8H19c.6 0 1-.4 1-1s-.4-1-1-1h-3.8l-.7-1.7c-.2-.4-.6-.7-1.1-.7-.5 0-.9.3-1.1.7L11.8 4H8c-.6 0-1 .4-1 1s.4 1 1 1h3.2l-3.4 8H5.5c-.6 0-1 .4-1 1s.4 1 1 1h2.8l-.7 1.7c-.2.4-.2.9.1 1.3.3.4.7.6 1.2.6h6.4c.5 0 .9-.2 1.2-.6.3-.4.3-.9.1-1.3l-.7-1.7h2.8zM12 6.5l1.7 4H10.3l1.7-4zM9.3 19l1.7-4h2l1.7 4H9.3z" />
          </svg>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Your Dream Trip Planned Instantly
          </h1>
          
          <p className="text-xl text-gray-600 mb-12">
            Skip the endless research. Just tell us where you want to go, and get a 
            perfect itinerary tailored to your interests.
          </p>

          {/* Steps Card */}
          <Card className="p-8 mb-12 bg-white shadow-lg">
            <div className="space-y-8">
              <div className="flex items-center space-x-6">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">1</span>
                <span className="text-lg">Enter your destination</span>
              </div>
              <div className="flex items-center space-x-6">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">2</span>
                <span className="text-lg">Set your dates & interests</span>
              </div>
              <div className="flex items-center space-x-6">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">3</span>
                <span className="text-lg">Get your perfect itinerary instantly</span>
              </div>
            </div>
          </Card>

          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 h-auto"
            onClick={() => window.location.href = 'https://quipitnextjs.vercel.app/agents1'}
          >
            Plan My Trip Now
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-gray-300">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Follow Us */}
            <div>
              <h3 className="font-bold text-lg text-white mb-4">Follow Us</h3>
              <ul className="space-y-2">
                <li>Facebook</li>
                <li>Instagram</li>
                <li>Twitter</li>
                <li>Youtube</li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-bold text-lg text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>Privacy Policy</li>
                <li>Terms and Conditions</li>
                <li>Refund Policy</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-lg text-white mb-4">Call Us</h3>
              <p className="mb-2">1800 1238 1238</p>
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