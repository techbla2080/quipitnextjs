"use client";

import { Sparkles, Plane, Image, Utensils, Package, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/sidebar";

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-16 mt-8">
        <h1 className="text-5xl font-extrabold mb-4 text-blue-700 dark:text-cyan-400 flex items-center justify-center gap-2">
          <Sparkles className="w-10 h-10 text-cyan-500" />
          Quipit
        </h1>
        <h2 className="text-2xl text-gray-800 dark:text-gray-200 mb-6">
          Your Everyday <span className="text-cyan-600 dark:text-cyan-400">AI Workspace</span>
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
          From planning trips to designing products—Quipit brings all your AI tools together in one place.<br />
          Start with our Travel Agent and Image Generator. Tomorrow, discover even more.
        </p>
        <div className="flex justify-center gap-4">
          {/* <a href="/signup">
            <Button className="bg-cyan-600 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow hover:bg-cyan-700 transition">Try Free</Button>
          </a>
          <a href="#demo">
            <Button variant="outline" className="px-8 py-3 text-lg font-semibold rounded-lg border-cyan-600 text-cyan-600 hover:bg-cyan-100">See Demo</Button>
          </a> */}
        </div>
      </div>

      {/* Features Section */}
      <div className="text-center mb-10">
        <h3 className="text-2xl font-bold text-blue-700 dark:text-cyan-400 mb-2">Today's Featured Agents</h3>
        <p className="text-gray-700 dark:text-gray-300">
          Explore our Travel Agent and Image Generator. More AI tools coming soon…
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        {/* Travel Agent */}
        <Card className="p-8 bg-white/90 dark:bg-gray-900/80 shadow-xl rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <Plane className="w-10 h-10 text-blue-500" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Travel Agent</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Enter your location and dates—get a full, personalized travel plan in seconds.
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-4">
            <li>Smart itineraries</li>
            <li>Real-time recommendations</li>
            <li>Interactive maps</li>
          </ul> 
          <Button onClick={() => window.location.href = "/agents1"} className="bg-blue-600 text-white w-full">Try Travel Agent</Button>
        </Card>

        {/* Image Generator */}
        <Card className="p-8 bg-white/90 dark:bg-gray-900/80 shadow-xl rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <Image className="w-10 h-10 text-blue-500" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Image Generator</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FeatureCard icon={<Home className="w-6 h-6 text-blue-500" />} title="3D Interior Creator" desc="Transform blank spaces into beautiful 3D rooms." />
            <FeatureCard icon={<Package className="w-6 h-6 text-blue-500" />} title="Product Designer" desc="Bring your product ideas to life with AI." />
            <FeatureCard icon={<Utensils className="w-6 h-6 text-blue-500" />} title="Recipe Generator" desc="Get unique, visual recipes for any occasion." />
            <FeatureCard icon={<Plane className="w-6 h-6 text-blue-500" />} title="Travel Visuals" desc="Generate travel images for your itinerary." />
          </div>
          <Button onClick={() => window.location.href = "/agents2"} className="bg-blue-600 text-white w-full">Try Image Generator</Button>
        </Card>
      </div>

      {/* How It Works */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <HowItWorksCard
            title="Travel Agent"
            steps={[
              "Enter your location and travel dates.",
              "AI generates a personalized itinerary.",
              "Explore, book, and enjoy your trip!"
            ]}
          />
          <HowItWorksCard
            title="Image Generator"
            steps={[
              "Choose a feature (3D Interior, Product, Recipe, Travel Visual).",
              "Upload an image or describe your idea.",
              "Get instant, AI-powered results."
            ]}
          />
        </div>
      </section>

      {/* Demo/Showcase Placeholder */}
      <section id="demo" className="mb-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">See It In Action</h2>
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <img src="/demo1.png" alt="Demo 1" className="rounded-lg shadow w-64 h-40 object-cover" />
          <img src="/demo2.png" alt="Demo 2" className="rounded-lg shadow w-64 h-40 object-cover" />
          <img src="/demo3.png" alt="Demo 3" className="rounded-lg shadow w-64 h-40 object-cover" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-8">See what Quipit can do for you!</p>
      </section>

      {/* CTA */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">Ready to experience the future?</h2>
        <a href="/agent-selection">
          <Button className="bg-blue-600 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow hover:bg-blue-700 transition">Start</Button>
        </a>
      </div>

      <footer className="w-full bg-gray-900 text-gray-300 py-10 mt-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo and tagline */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-7 h-7 text-cyan-400" />
              <span className="text-2xl font-bold text-white">Quipit</span>
            </div>
            <span className="text-gray-400 text-sm">Your Everyday AI Workspace</span>
          </div>
          {/* Quick links */}
          <div className="flex flex-col md:flex-row gap-4 text-sm">
            <a href="/" className="hover:text-cyan-400 transition">Home</a>
            <a href="/about" className="hover:text-cyan-400 transition">About</a>
            <a href="/terms" className="hover:text-cyan-400 transition">Terms</a>
            <a href="/privacy-policy" className="hover:text-cyan-400 transition">Privacy</a>
          </div>
          {/* Contact and socials */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <span className="text-gray-400 text-sm">Contact: <a href="mailto:info@quipit.ai" className="hover:text-cyan-400">info@quipit.ai</a></span>
            <span className="text-gray-400 text-sm">+91-98300-16577</span>
            <div className="flex gap-3 mt-2">
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.59-2.47.7a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 9.13 4.07 7.38 1.64 4.7c-.37.64-.58 1.38-.58 2.17 0 1.5.76 2.82 1.92 3.6-.71-.02-1.38-.22-1.97-.54v.05c0 2.1 1.5 3.85 3.5 4.25-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.7 2.1 2.94 3.95 2.97A8.6 8.6 0 0 1 2 19.54c-.29 0-.57-.02-.85-.05A12.13 12.13 0 0 0 8.29 21.5c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.18 8.18 0 0 0 24 4.59a8.36 8.36 0 0 1-2.54.7z"/></svg>
              </a>
              {/* Add more social icons as needed */}
            </div>
          </div>
        </div>
        <div className="text-center text-gray-500 text-xs mt-8">
          &copy; {new Date().getFullYear()} Quipit. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow flex flex-col items-center">
      {icon}
      <h4 className="font-semibold mt-2 mb-1 text-gray-900 dark:text-white">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-300 text-center">{desc}</p>
    </div>
  );
}

type HowItWorksCardProps = {
  title: string;
  steps: string[];
};

function HowItWorksCard({ title, steps }: HowItWorksCardProps) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4 text-blue-600">{title}</h3>
      <ol className="list-decimal pl-6 text-gray-700 dark:text-gray-300 space-y-2">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </div>
  );
}