import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Trip } from '@/models/Trip';
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

    await connectDB();
    
    let user = await User.findOne({ userId });
    
    if (!user) {
      user = await User.create({
        userId,
        tripCount: 0,
        imageCount: 0,
        subscriptionStatus: 'free'
      });
    }

    // Check if subscription has expired
    if (user.subscriptionStatus === 'pro' && user.subscriptionEndDate) {
      const now = new Date();
      if (now > user.subscriptionEndDate) {
        // Subscription has expired, update to 'free'
        user = await User.findOneAndUpdate(
          { userId },
          {
            $set: {
              subscriptionStatus: 'free',
              subscriptionStartDate: undefined,
              subscriptionEndDate: undefined,
            },
          },
          { new: true }
        );
      }
    }

    // Get actual counts from database
    const actualTrips = await Trip.countDocuments({ userId });
    
    // Get actual image count from Supabase
    const { data: images, error: imageError } = await supabase
      .from('saved_images')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);
    
    const actualImages = images?.length || 0;

    // Update user counts if they don't match
    if (actualTrips !== user.tripCount || actualImages !== user.imageCount) {
      user = await User.findOneAndUpdate(
        { userId },
        { 
          $set: { 
            tripCount: actualTrips,
            imageCount: actualImages
          } 
        },
        { new: true }
      );
    }

    // Check limits for free users
    const canCreateTrip = user.subscriptionStatus === 'pro' || actualTrips < 1;
    const canCreateImage = user.subscriptionStatus === 'pro' || actualImages < 1;

    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        subscriptionStatus: user.subscriptionStatus,
        tripCount: user.tripCount,
        imageCount: user.imageCount,
        canCreateTrip,
        canCreateImage,
        subscriptionExpires: user.subscriptionEndDate?.toISOString()
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