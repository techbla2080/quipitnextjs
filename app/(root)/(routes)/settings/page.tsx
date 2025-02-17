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
      <div className="md:ml-64 p-4 md:p-8 dark:bg-gray-900">
        <div className="max-w-full md:max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Subscription Status</h2>
            
            {subscriptionStatus.isSubscribed ? (
              <div className="mb-4">
                <p className="text-green-600 dark:text-green-400 font-semibold">
                  You are currently on a Pro plan
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Free Plan: {subscriptionStatus.remainingTrips} trips remaining
                </p>
                <div className="mt-4 p-4 border dark:border-gray-700 rounded-lg dark:bg-gray-800/50">
                  <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Pro Subscription</h3>
                  <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">$9.99/month</p>
                  <ul className="mt-4 space-y-2 text-gray-700 dark:text-gray-300">
                    <li>✓ Unlimited trips</li>
                    <li>✓ Premium features</li>
                    <li>✓ Priority support</li>
                  </ul>
                </div>
              </div>
            )}
  
            <Button 
              onClick={handleSubscribe}
              className="mt-4 w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white"
            >
              {subscriptionStatus.isSubscribed 
                ? 'Manage Subscription' 
                : 'Subscribe Now'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}