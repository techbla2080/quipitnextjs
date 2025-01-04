import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane } from "lucide-react";

const TravelPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Minimal Header */}
      <header className="p-6">
        <h1 className="text-2xl font-bold">Quipit</h1>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-6 flex justify-center">
            <Plane className="w-16 h-16 text-blue-500" />
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
            Your Perfect Trip Planned in <span className="text-blue-600">One Click</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Tell us where you want to go, and our AI will create a personalized itinerary 
            that matches your interests. No more hours of research needed.
          </p>

          <Card className="p-8 mb-8 bg-white shadow-lg">
            <div className="space-y-6">
              <div className="flex items-center space-x-4 justify-center text-lg">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">1</span>
                <span>Enter your destination</span>
              </div>
              <div className="flex items-center space-x-4 justify-center text-lg">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">2</span>
                <span>Set your dates & interests</span>
              </div>
              <div className="flex items-center space-x-4 justify-center text-lg">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">3</span>
                <span>Get your perfect itinerary instantly</span>
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
      <footer className="bg-gray-900 py-12 text-gray-300 mt-auto">
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