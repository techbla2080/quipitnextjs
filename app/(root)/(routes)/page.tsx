"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, PenTool, TreePine } from "lucide-react"; // Icons for agents

const TravelPage = () => {
  // Define the three agents, all available
  const agents = [
    {
      name: "NovaTrek",
      subName: "Travel Planner",
      icon: <Plane className="w-12 h-12 text-blue-500" />,
      description: "Experience AI-powered travel planning. Get personalized itineraries, real-time recommendations, and interactive maps for your dream destinations.",
      link: "https://quipit.ai/agents1",
    },
    {
      name: "DropThought",
      subName: "Note Taking",
      icon: <PenTool className="w-12 h-12 text-blue-500" />,
      description: "Revolutionize your note-taking with AI that organizes, connects, and enhances your thoughts.",
      link: "https://quipit.ai/agents2", // Update with real link if different
    },
    {
      name: "Nexus",
      subName: "Productivity Tree",
      icon: <TreePine className="w-12 h-12 text-blue-500" />,
      description: "Visualize your productivity with an AI-powered mind mapping system that grows with your tasks.",
      link: "https://quipit.ai/agents3", // Update with real link if different
    },
  ];

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
            <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Just Quipit!</h2>
          </div>

          {/* Introduce Three Agents */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Our Quipit Agents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {agents.map((agent, index) => (
                <Card key={index} className="p-6 bg-white dark:bg-gray-800 shadow-md">
                  <div className="flex justify-center mb-4">{agent.icon}</div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{agent.name}</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">{agent.subName}</p>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{agent.description}</p>
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    onClick={() => window.location.href = agent.link}
                  >
                    Try Now
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          {/* Tabs Navigation */}
          <Card className="p-4 sm:p-8 mb-12 bg-white dark:bg-gray-800 shadow-lg max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              {agents.map((agent, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className={`text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20 ${index === 0 ? "bg-blue-100 dark:bg-blue-900/20" : ""}`}
                  onClick={() => window.location.href = agent.link}
                >
                  {agent.name}
                </Button>
              ))}
            </div>
            <p className="text-center text-gray-600 dark:text-gray-300 mt-4">
              Select an agent above to get started!
            </p>
          </Card>
        </div>
      </main>

      {/* Footer (unchanged) */}
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
                <li><a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Privacy Policy</a></li>
                <li><a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Terms and Conditions</a></li>
                <li><a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Refund Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white mb-4">Call Us</h3>
              <p className="mb-2"><a href="https://www.facebook.com/Ai.Quipit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">+919830016577</a></p>
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