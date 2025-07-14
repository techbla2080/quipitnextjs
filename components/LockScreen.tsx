"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Lock, Crown, Sparkles, Image, Plane } from 'lucide-react';

interface LockScreenProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'image' | 'trip' | 'both';
  currentImages?: number;
  currentTrips?: number;
}

export default function LockScreen({ 
  isOpen, 
  onClose, 
  limitType, 
  currentImages = 0, 
  currentTrips = 0 
}: LockScreenProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setIsLoading(true);
    router.push('/settings');
  };

  const getTitle = () => {
    switch (limitType) {
      case 'image':
        return 'Image Generation Locked!';
      case 'trip':
        return 'Trip Creation Locked!';
      case 'both':
        return 'Free Plan Limits Reached!';
      default:
        return 'Feature Locked!';
    }
  };

  const getDescription = () => {
    switch (limitType) {
      case 'image':
        return `You've created ${currentImages} image on your free plan. Upgrade to Pro for unlimited image generation!`;
      case 'trip':
        return `You've created ${currentTrips} trip on your free plan. Upgrade to Pro for unlimited trips!`;
      case 'both':
        return `You've reached your free plan limits (${currentTrips} trip, ${currentImages} image). Upgrade to Pro for unlimited access!`;
      default:
        return 'Upgrade to Pro for unlimited access to all features!';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden border-0">
        {/* Header with Lock Icon */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Lock className="w-12 h-12 text-white" />
              <div className="absolute -top-1 -right-1">
                <Crown className="w-6 h-6 text-yellow-300" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center">{getTitle()}</h1>
          <p className="text-red-100 text-sm text-center mt-2">
            {getDescription()}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Unlimited Image Generation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Create unlimited AI images for rooms, products, recipes, and travel
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Unlimited Trip Planning</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Create as many AI-powered travel itineraries as you want
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Priority Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Get faster responses and dedicated support
                </p>
              </div>
            </div>
          </div>

          {/* Current Usage */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Your Current Usage:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Trips: {currentTrips}/1 (Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Images: {currentImages}/1 (Free)</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button 
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Upgrade to Pro
                </div>
              )}
            </Button>
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Continue with Free Plan
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 