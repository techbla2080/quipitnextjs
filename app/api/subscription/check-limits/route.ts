import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user subscription status from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    let subscriptionStatus = 'free';
    let subscriptionExpires = null;

    if (user) {
      subscriptionStatus = user.subscription_status || 'free';
      subscriptionExpires = user.subscription_end_date;

      // Check if subscription has expired
      if (subscriptionStatus === 'pro' && subscriptionExpires) {
        const now = new Date();
        const endDate = new Date(subscriptionExpires);
        if (now > endDate) {
          // Subscription has expired, update to 'free'
          await supabase
            .from('users')
            .update({ 
              subscription_status: 'free',
              subscription_start_date: null,
              subscription_end_date: null
            })
            .eq('user_id', userId);
          
          subscriptionStatus = 'free';
          subscriptionExpires = null;
        }
      }
    } else {
      // Create new user record if doesn't exist
      await supabase
        .from('users')
        .insert([{
          user_id: userId,
          subscription_status: 'free',
          trip_count: 0,
          image_count: 0
        }]);
    }

    // Get actual trip count from Supabase
    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);
    const actualTrips = trips?.length || 0;
    
    // Get actual image count from Supabase
    const { data: images, error: imageError } = await supabase
      .from('saved_images')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);
    const actualImages = images?.length || 0;

    // Update user counts if they don't match
    if (user && (actualTrips !== user.trip_count || actualImages !== user.image_count)) {
      await supabase
        .from('users')
        .update({ 
          trip_count: actualTrips,
          image_count: actualImages
        })
        .eq('user_id', userId);
    }

    // Check limits for free users
    const canCreateTrip = subscriptionStatus === 'pro' || actualTrips < 1;
    const canCreateImage = subscriptionStatus === 'pro' || actualImages < 1;

    return NextResponse.json({
      success: true,
      user: {
        userId: userId,
        subscriptionStatus: subscriptionStatus,
        tripCount: actualTrips,
        imageCount: actualImages,
        canCreateTrip,
        canCreateImage,
        subscriptionExpires: subscriptionExpires
      },
      limits: {
        freeTripLimit: 1,
        freeImageLimit: 1,
        currentTrips: actualTrips,
        currentImages: actualImages
      }
    });

  } catch (error) {
    console.error('Check limits error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check user limits' },
      { status: 500 }
    );
  }
} 