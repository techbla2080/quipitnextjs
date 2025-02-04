"use client";

import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Script from 'next/script';

export default function SettingsPage() {
  const { userId } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isSubscribed: false,
    remainingTrips: 0
  });

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await fetch(`/api/subscription/check?userId=${userId}`);
        const data = await response.json();
        setSubscriptionStatus({
          isSubscribed: data.isSubscribed,
          remainingTrips: data.remainingTrips || 0
        });
      } catch (error) {
        console.error('Failed to check subscription:', error);
      }
    };

    if (userId) {
      checkSubscription();
    }
  }, [userId]);

  const handleSubscribe = async () => {
    console.log("Button clicked");
    try {
      // Create Razorpay order
      const response = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      console.log("Response:", response);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Initialize Razorpay
      const options = {
        key: data.key,
        amount: data.amount * 100,
        currency: "INR",
        name: "Trip Planner Pro",
        description: "Subscription Payment",
        order_id: data.order_id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/subscription/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                userId
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Update subscription status
              const updateResponse = await fetch('/api/subscription/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  status: 'pro',
                  userId 
                })
              });

              if (!updateResponse.ok) {
                throw new Error('Failed to update subscription status');
              }

              toast.success('Successfully subscribed!');
              setSubscriptionStatus(prev => ({ ...prev, isSubscribed: true }));
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com"
        },
        theme: {
          color: "#0891b2"
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Subscribe error:', error);
      toast.error('Failed to initialize payment');
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Subscription Status</h2>
          
          {subscriptionStatus.isSubscribed ? (
            <div className="mb-4">
              <p className="text-green-600 font-semibold">
                You are currently on a Pro plan
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-gray-600">
                Free Plan: {subscriptionStatus.remainingTrips} trips remaining
              </p>
              <div className="mt-4 p-4 border rounded-lg">
                <h3 className="text-xl font-bold mb-2">Pro Subscription</h3>
                <p className="text-2xl font-bold text-cyan-600">₹999/month</p>
                <ul className="mt-4 space-y-2">
                  <li>✓ Unlimited trips</li>
                  <li>✓ Premium features</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubscribe}
            className="mt-4"
          >
            {subscriptionStatus.isSubscribed 
              ? 'Manage Subscription' 
              : 'Subscribe Now'}
          </Button>
        </div>
      </div>
    </>
  );
}