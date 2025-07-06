"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Crown, Plane, Image, CheckCircle, Sparkles } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'trip' | 'image' | 'both';
  currentTrips?: number;
  currentImages?: number;
}

export default function SubscriptionModal({ 
  isOpen, 
  onClose, 
  limitType, 
  currentTrips = 0, 
  currentImages = 0 
}: SubscriptionModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    setIsLoading(true);
    router.push('/settings');
  };

  const getTitle = () => {
    switch (limitType) {
      case 'trip':
        return 'Trip Limit Reached!';
      case 'image':
        return 'Image Limit Reached!';
      case 'both':
        return 'Free Plan Limits Reached!';
      default:
        return 'Upgrade to Pro!';
    }
  };

  const getDescription = () => {
    switch (limitType) {
      case 'trip':
        return `You've created ${currentTrips} trip on your free plan. Upgrade to Pro for unlimited trips!`;
      case 'image':
        return `You've created ${currentImages} image on your free plan. Upgrade to Pro for unlimited images!`;
      case 'both':
        return `You've reached your free plan limits (${currentTrips} trip, ${currentImages} image). Upgrade to Pro for unlimited access!`;
      default:
        return 'Upgrade to Pro for unlimited access to all features!';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-300" />
            <h1 className="text-2xl font-bold">{getTitle()}</h1>
          </div>
          
          <p className="text-blue-100 text-sm">
            {getDescription()}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Unlimited Trips</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Create as many AI-powered travel itineraries as you want
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Unlimited Images</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Generate unlimited AI images for rooms, products, recipes, and travel
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
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
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
              Maybe Later
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 