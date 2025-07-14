"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import LockScreen from '@/components/LockScreen';

interface LockScreenData {
  isOpen: boolean;
  limitType: 'image' | 'trip' | 'both';
  currentImages: number;
  currentTrips: number;
}

export function useLockScreen() {
  const { userId, isSignedIn } = useAuth();
  const [lockScreen, setLockScreen] = useState<LockScreenData>({
    isOpen: false,
    limitType: 'image',
    currentImages: 0,
    currentTrips: 0
  });

  const showLockScreen = (type: 'image' | 'trip' | 'both', currentImages = 0, currentTrips = 0) => {
    setLockScreen({
      isOpen: true,
      limitType: type,
      currentImages,
      currentTrips
    });
  };

  const hideLockScreen = () => {
    setLockScreen(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const handleShowLockScreen = (event: CustomEvent) => {
      const { type, currentImages, currentTrips } = event.detail;
      showLockScreen(type, currentImages, currentTrips);
    };

    window.addEventListener('showLockScreen', handleShowLockScreen as EventListener);
    
    return () => {
      window.removeEventListener('showLockScreen', handleShowLockScreen as EventListener);
    };
  }, []);

  return {
    lockScreen,
    showLockScreen,
    hideLockScreen
  };
}

export default function LockScreenProvider({ children }: { children: React.ReactNode }) {
  const { lockScreen, hideLockScreen } = useLockScreen();

  return (
    <>
      {children}
      <LockScreen
        isOpen={lockScreen.isOpen}
        onClose={hideLockScreen}
        limitType={lockScreen.limitType}
        currentImages={lockScreen.currentImages}
        currentTrips={lockScreen.currentTrips}
      />
    </>
  );
} 