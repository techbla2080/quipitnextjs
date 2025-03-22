"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Plane, PenTool, TreePine, ChevronRight, MapPin, MessageSquare, Clock, Phone } from "lucide-react"; // Added missing icons

const TravelPage = () => {
  // Define the three agents, all available, with content from FuturisticHomePage
  const agents = [
    {
      name: "NovaTrek",
      subName: "Travel Planner",
      icon: <Plane className="w-12 h-12 text-blue-500" />,
      description: "Experience AI-powered travel planning. Get personalized itineraries, real-time recommendations, and interactive maps for your dream destinations.",
      features: ["Custom itineraries", "Interactive maps", "Local insights", "Budget optimization", "Real-time recommendations"],
      link: "https://quipit.ai/agents1",
    },
    {
      name: "DropThought",
      subName: "Note Taking",
      icon: <PenTool className="w-12 h-12 text-blue-500" />,
      description: "Revolutionize your note-taking with AI that organizes, connects, and enhances your thoughts. Capture ideas instantly and transform them into actionable insights.",
      features: ["Smart organization", "Cross-linked ideas", "Voice-to-text", "Multi-media support", "Semantic search"],
      link: "https://quipit.ai/agents2", // Update with real link
    },
    {
      name: "MindBloom", // Renamed from Nexus
      subName: "Productivity Tree",
      icon: <TreePine className="w-12 h-12 text-blue-500" />,
      description: "Visualize your productivity with an AI-powered mind mapping system that grows as you accomplish tasks, connecting your work in meaningful, revealing patterns.",
      features: ["Visual task mapping", "Progress visualization", "AI connections", "Team collaboration", "Growth metrics"],
      link: "https://quipit.ai/agents3", // Update with real link
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
          {/* Quipit Intro Section (from FuturisticHomePage Hero) */}
          <div className="mb-12">
            <div className="mb-6 flex justify-center">
              <Sparkles className="w-16 h-16 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              Your Personal AI Ecosystem
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Experience the future of productivity with intelligent AI agents that transform how you travel, organize thoughts, and manage tasks.
            </p>
          </div>

          {/* About NovaTrek */}
          <div className="mb-12">
            <div className="mb-6 flex justify-center">
              <Plane className="w-16 h-16 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              NovaTrek: Your Travel Planner
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
              Experience AI-powered travel planning. Get personalized itineraries, real-time recommendations, and interactive maps for your dream destinations.
            </p>
            <ul className="text-gray-600 dark:text-gray-300 space-y-2">
              {agents[0].features.map((feature, i) => (
                <li key={i} className="flex items-start justify-center">
                  <ChevronRight className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* About DropThought */}
          <div className="mb-12">
            <div className="mb-6 flex justify-center">
              <PenTool className="w-16 h-16 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              DropThought: Your Note-Taking Assistant
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
              Revolutionize your note-taking with AI that organizes, connects, and enhances your thoughts. Capture ideas instantly and transform them into actionable insights.
            </p>
            <ul className="text-gray-600 dark:text-gray-300 space-y-2">
              {agents[1].features.map((feature, i) => (
                <li key={i} className="flex items-start justify-center">
                  <ChevronRight className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* About MindBloom (Renamed from Nexus) */}
          <div className="mb-12">
            <div className="mb-6 flex justify-center">
              <TreePine className="w-16 h-16 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              MindBloom: Your Productivity Tree
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
              Visualize your productivity with an AI-powered mind mapping system that grows as you accomplish tasks, connecting your work in meaningful, revealing patterns.
            </p>
            <ul className="text-gray-600 dark:text-gray-300 space-y-2">
              {agents[2].features.map((feature, i) => (
                <li key={i} className="flex items-start justify-center">
                  <ChevronRight className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketing Tagline */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Just Quipit!</h2>
          </div>

          {/* Access to Agents (Cards) */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Get Started with Quipit Agents</h3>
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

      {/* Footer (from FuturisticHomePage) */}
      <footer className="bg-gray-900 py-12 text-gray-300 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-400 mr-2" />
                <span className="text-xl font-bold text-white">Quipit</span>
              </div>
              <p className="text-gray-400 mb-4">
                AI that works for you. Revolutionizing travel, note-taking, and productivity.
              </p>
              <div className="flex space-x-4">
                {["twitter", "facebook", "instagram", "linkedin"].map((social) => (
                  <a
                    key={social}
                    href={`https://${social}.com/Ai.Quipit`}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">{social}</span>
                    <div className="w-4 h-4"></div>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Products</h3>
              <ul className="space-y-3">
                <li><a href="/agents1" className="text-gray-400 hover:text-blue-400 transition-colors">NovaTrek</a></li>
                <li><a href="/agents2" className="text-gray-400 hover:text-blue-400 transition-colors">DropThought</a></li>
                <li><a href="/agents3" className="text-gray-400 hover:text-blue-400 transition-colors">MindBloom</a></li>
                <li><a href="/pricing" className="text-gray-400 hover:text-blue-400 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="/about" className="text-gray-400 hover:text-blue-400 transition-colors">About Us</a></li>
                <li><a href="/careers" className="text-gray-400 hover:text-blue-400 transition-colors">Careers</a></li>
                <li><a href="/blog" className="text-gray-400 hover:text-blue-400 transition-colors">Blog</a></li>
                <li><a href="/privacy-policy" className="text-gray-400 hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-gray-400 hover:text-blue-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <MapPin className="w-5 h-5 text-blue-400 mr-2 mt-0.5 shrink-0" />
                  <span className="text-gray-400">95A Park Street, Kolkata 700016</span>
                </li>
                <li className="flex items-start">
                  <MessageSquare className="w-5 h-5 text-blue-400 mr-2 mt-0.5 shrink-0" />
                  <span className="text-gray-400">customercare@quipit.com</span>
                </li>
                <li className="flex items-start">
                  <Clock className="w-5 h-5 text-blue-400 mr-2 mt-0.5 shrink-0" />
                  <span className="text-gray-400">Mon-Sat (9.30AM-6.30PM)</span>
                </li>
                <li className="flex items-start">
                  <Phone className="w-5 h-5 text-blue-400 mr-2 mt-0.5 shrink-0" />
                  <span className="text-gray-400">+919830016577</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Quipit. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="/privacy-policy" className="text-gray-500 hover:text-blue-400 text-sm">Privacy</a>
              <a href="/terms" className="text-gray-500 hover:text-blue-400 text-sm">Terms</a>
              <a href="/cookies" className="text-gray-500 hover:text-blue-400 text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TravelPage;