"use client";

import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Plane, Image, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function UsageIndicator() {
  const { limits, loading, isProUser } = useSubscriptionLimits();

  if (loading || !limits) {
    return null;
  }

  const { user, limits: limitData } = limits;
  const isPro = isProUser();

  return (
    <Card className="p-4 bg-white/90 dark:bg-gray-800/90 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {isPro ? (
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              Pro Plan
            </div>
          ) : (
            'Free Plan Usage'
          )}
        </h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Trips</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {limitData.currentTrips}
            </span>
            {!isPro && (
              <span className="text-xs text-gray-500">/ {limitData.freeTripLimit}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Images</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {limitData.currentImages}
            </span>
            {!isPro && (
              <span className="text-xs text-gray-500">/ {limitData.freeImageLimit}</span>
            )}
          </div>
        </div>
      </div>
      
      {!isPro && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xs text-gray-500">
              {Math.max(limitData.currentTrips, limitData.currentImages)}/1 used
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
              style={{ 
                width: `${Math.min(100, Math.max(limitData.currentTrips, limitData.currentImages) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
} 