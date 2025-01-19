"use client";

import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const { userId } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isSubscribed: boolean;
    remainingFreeTrips: number;
  }>({ isSubscribed: false, remainingFreeTrips: 2 });

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await fetch(`/api/subscription/check?userId=${userId}`);
        const data = await response.json();
        if (data.success) {
          setSubscriptionStatus({
            isSubscribed: data.isSubscribed,
            remainingFreeTrips: data.remainingFreeTrips
          });
        }
      } catch (error) {
        console.error('Failed to check subscription:', error);
      }
    };

    if (userId) {
      checkSubscription();
    }
  }, [userId]);

  const handleManageSubscription = async () => {
    try {
      // Your Razorpay integration code here
      const response = await fetch('/api/subscription/create-order', {
        method: 'POST'
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      const options = {
        key: data.key,
        amount: data.amount * 100,
        currency: "INR",
        name: "Trip Planner Pro",
        description: "Trip Planner Pro Subscription",
        order_id: data.order_id,
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/subscription/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              toast.success('Successfully subscribed!');
              setSubscriptionStatus(prev => ({ ...prev, isSubscribed: true }));
            }
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        theme: {
          color: "#0891b2",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error('Failed to initiate payment');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Subscription Status</h2>
        
        {subscriptionStatus.isSubscribed ? (
          <div className="mb-4">
            <p className="text-green-600 font-semibold">
              You are currently on a Pro plan.
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-gray-600">
              Free Plan: {subscriptionStatus.remainingFreeTrips} trips remaining
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
          onClick={handleManageSubscription}
          className="mt-4"
        >
          {subscriptionStatus.isSubscribed 
            ? 'Manage Subscription' 
            : 'Subscribe Now'}
        </Button>
      </div>
    </div>
  );
}