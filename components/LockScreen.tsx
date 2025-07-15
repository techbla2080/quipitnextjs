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
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 32,
        minWidth: 320,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, color: '#06b6d4', marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontWeight: 'bold', fontSize: 24, marginBottom: 12 }}>Upgrade Required</h2>
        <p style={{ marginBottom: 24 }}>You’ve reached your free trip limit.<br />Upgrade to Pro to unlock unlimited trips!</p>
        <button
          style={{
            background: '#06b6d4',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 32px',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer'
          }}
          onClick={() => { window.location.href = '/pricing'; }}
        >
          Upgrade to Pro
        </button>
        <div>
          <button
            style={{
              marginTop: 16,
              background: 'transparent',
              color: '#06b6d4',
              border: 'none',
              fontSize: 14,
              cursor: 'pointer'
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 