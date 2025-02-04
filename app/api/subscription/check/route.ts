import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Trip } from '@/models/Trip';
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

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
        subscriptionStatus: 'free'
      });
    }

    // Check if user is subscribed
    if (user.subscriptionStatus === 'pro') {
      return NextResponse.json({
        success: true,
        canCreate: true,
        isSubscribed: true,
        subscriptionStatus: 'pro'
      });
    }

    // For free users, count trips
    const actualTrips = await Trip.countDocuments({ userId });
    
    if (actualTrips !== user.tripCount) {
      user = await User.findOneAndUpdate(
        { userId },
        { $set: { tripCount: actualTrips } },
        { new: true }
      );
    }

    const canCreate = actualTrips < 2;

    return NextResponse.json({
      success: true,
      canCreate,
      tripCount: actualTrips,
      remainingTrips: 2 - actualTrips,
      isSubscribed: false,
      subscriptionStatus: 'free'
    });

  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}