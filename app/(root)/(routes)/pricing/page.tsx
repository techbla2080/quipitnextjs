"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col items-center justify-center py-16 px-4">
      <h1 className="text-4xl font-extrabold text-blue-700 mb-2">Choose Your Plan</h1>
      <p className="text-lg text-gray-600 mb-10">Simple, transparent pricing. No hidden fees.</p>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center">
        {/* Free Tier */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex-1 flex flex-col items-center border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Free</h2>
          <p className="text-4xl font-extrabold mb-2">$0</p>
          <p className="text-gray-500 mb-6">per month</p>
          <ul className="mb-8 space-y-3 text-gray-700">
            <li className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" /> 1 AI Trip Plan
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" /> 1 AI Image Generation
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" /> Basic Support
            </li>
          </ul>
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        </div>
        {/* Paid Tier */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex-1 flex flex-col items-center border-4 border-yellow-400 relative">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-400 text-white px-4 py-1 rounded-full font-bold text-xs shadow">
            Most Popular
          </div>
          <h2 className="text-2xl font-bold text-yellow-600 mb-2">Pro</h2>
          <p className="text-4xl font-extrabold mb-2">$30</p>
          <p className="text-gray-500 mb-6">per month</p>
          <ul className="mb-8 space-y-3 text-gray-700">
            <li className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" /> Unlimited AI Trip Plans
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" /> Unlimited AI Image Generations
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" /> Priority Support
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="text-yellow-500 w-5 h-5" /> All Future Features
            </li>
          </ul>
          <Link href="/settings">
            <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold text-lg shadow-lg">
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
