"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import SubscriptionModal from '@/components/SubscriptionModal';

interface UserLimits {
  userId: string;
  subscriptionStatus: 'free' | 'pro';
  tripCount: number;
  imageCount: number;
  canCreateTrip: boolean;
  canCreateImage: boolean;
  subscriptionExpires?: string;
}

interface LimitsData {
  user: UserLimits;
  limits: {
    freeTripLimit: number;
    freeImageLimit: number;
    currentTrips: number;
    currentImages: number;
  };
}

export function useSubscriptionLimits() {
  const { userId, isSignedIn } = useAuth();
  const [limits, setLimits] = useState<LimitsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'trip' | 'image' | 'both'>('trip');

  const fetchLimits = async () => {
    if (!isSignedIn || !userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/subscription/check-limits');
      const data = await response.json();
      
      if (data.success) {
        setLimits(data);
      }
    } catch (error) {
      console.error('Failed to fetch limits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, [isSignedIn, userId]);

  useEffect(() => {
    const handleShowModal = (event: CustomEvent) => {
      const { type, currentImages, currentTrips } = event.detail;
      setModalType(type);
      setShowModal(true);
    };

    window.addEventListener('showSubscriptionModal', handleShowModal as EventListener);
    
    return () => {
      window.removeEventListener('showSubscriptionModal', handleShowModal as EventListener);
    };
  }, []);

  const checkAndShowModal = (action: 'trip' | 'image') => {
    if (!limits) return false;

    const { user } = limits;
    
    if (user.subscriptionStatus === 'pro') {
      return true; // Pro users can always create
    }

    let shouldShowModal = false;
    let modalType: 'trip' | 'image' | 'both' = 'trip';

    if (action === 'trip' && !user.canCreateTrip) {
      shouldShowModal = true;
      modalType = 'trip';
    } else if (action === 'image' && !user.canCreateImage) {
      shouldShowModal = true;
      modalType = 'image';
    } else if (!user.canCreateTrip && !user.canCreateImage) {
      shouldShowModal = true;
      modalType = 'both';
    }

    if (shouldShowModal) {
      setModalType(modalType);
      setShowModal(true);
      return false;
    }

    return true; // Can proceed
  };

  const canCreateTrip = () => {
    if (!limits) return false;
    return limits.user.canCreateTrip;
  };

  const canCreateImage = () => {
    if (!limits) return false;
    return limits.user.canCreateImage;
  };

  const isProUser = () => {
    if (!limits) return false;
    return limits.user.subscriptionStatus === 'pro';
  };

  return {
    limits,
    loading,
    canCreateTrip,
    canCreateImage,
    isProUser,
    checkAndShowModal,
    showModal,
    setShowModal,
    modalType,
    currentTrips: limits?.limits.currentTrips || 0,
    currentImages: limits?.limits.currentImages || 0,
    refreshLimits: fetchLimits
  };
}

export default function SubscriptionLimitsProvider({ children }: { children: React.ReactNode }) {
  const {
    showModal,
    setShowModal,
    modalType,
    currentTrips,
    currentImages
  } = useSubscriptionLimits();

  return (
    <>
      {children}
      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        limitType={modalType}
        currentTrips={currentTrips}
        currentImages={currentImages}
      />
    </>
  );
} 