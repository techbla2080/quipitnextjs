"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePlanTrip } from "@/hooks/usePlanTrip";
import { Toaster, toast } from "react-hot-toast"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import UserInfo from "@/components/UserInfo";
import { useAuth } from "@clerk/nextjs";
import DebugButton from "@/components/DebugButton";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import ProfessionalTripView from "@/components/ProfessionalTripView";
import TripMap from "@/components/TripMap";
import { Sidebar } from "@/components/sidebar";

const PADDLE_VENDOR_ID = 32088; // <-- Replace with your Paddle Sandbox Vendor ID (number)
const BASIC_PRODUCT_ID = "pro_01jwbwrt8yn9d1phzkektvarkg"; // ✅ CORRECT

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

// Updated TripData type
export type TripData = {
  location: string;
  cities: string;
  date_range: string;
  interests: string;
  job_id?: string;
  userId?: string;
};

// Add a new interface for saved itineraries
interface SavedItinerary {
  id: string;
  displayId: string;
  job_id: string;
  url: string;
  title: string;
  location: string;
  dateRange: string;
  interests: string[];
  cities: string[];
  content: any;
  formattedContent: {
    intro: string;
    days: string[];
  };
  createdAt: Date;
}

export default function SubscriptionPage() {
  useEffect(() => {
    // Load Paddle.js
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/paddle.js";
    script.onload = () => {
      // @ts-ignore
      window.Paddle.Setup({ vendor: PADDLE_VENDOR_ID, sandbox: true });
    };
    document.body.appendChild(script);
  }, []);

  const openPaddleCheckout = (productId: string) => {
    // @ts-ignore
    if (window.Paddle) {
      // @ts-ignore
      window.Paddle.Checkout.open({
        product: productId,
        successCallback: (data: any) => {
          alert("Payment successful! (Sandbox)");
        },
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-blue-700">Choose Your Plan</h1>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Basic Plan */}
        <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center w-80">
          <h2 className="text-2xl font-bold mb-2">Basic</h2>
          <p className="text-lg mb-4">$19.99/month</p>
          <ul className="mb-6 text-gray-600">
            <li>✔️ Core features</li>
            <li>✔️ Email support</li>
            <li>✔️ Free trial</li>
          </ul>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            onClick={() => openPaddleCheckout(BASIC_PRODUCT_ID)}
          >
            Start Free Trial
          </button>
        </div>
        {/* Premium Plan */}
        <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center w-80 border-2 border-blue-600">
          <h2 className="text-2xl font-bold mb-2 text-blue-700">Premium</h2>
          <p className="text-lg mb-4">$39.99/month</p>
          <ul className="mb-6 text-gray-600">
            <li>✔️ Everything in Basic</li>
            <li>✔️ Priority support</li>
            <li>✔️ Advanced features</li>
          </ul>
          <button
            className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 transition"
            onClick={() => openPaddleCheckout(PREMIUM_PRODUCT_ID)}
          >
            Coming Soon
          </button>
        </div>
        {/* Enterprise Plan */}
        <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center w-80">
          <h2 className="text-2xl font-bold mb-2">Enterprise</h2>
          <p className="text-lg mb-4">Custom</p>
          <ul className="mb-6 text-gray-600">
            <li>✔️ All Premium features</li>
            <li>✔️ Dedicated manager</li>
            <li>✔️ Custom integrations</li>
          </ul>
          <button
            className="bg-gray-700 text-white px-6 py-2 rounded hover:bg-gray-800 transition"
            onClick={() => window.location.href = "mailto:sales@yourcompany.com"}
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}