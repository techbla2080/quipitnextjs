import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Trip } from '@/models/Trip';  // Add this import
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Get or create user
    let user = await User.findOne({ userId });
    
    // If no user found, create one
    if (!user) {
      user = await User.create({
        userId,
        tripCount: 0
      });
    }

    // Count actual trips in the Trip collection
    const actualTrips = await Trip.countDocuments({ userId });
    
    // If actual trips don't match stored count, fix it
    if (actualTrips !== user.tripCount) {
      user = await User.findOneAndUpdate(
        { userId },
        { $set: { tripCount: actualTrips } },
        { new: true }
      );
    }

    // Use actual trip count to determine if they can create more
    const canCreate = actualTrips < 2;

    return NextResponse.json({
      success: true,
      canCreate,
      tripCount: actualTrips,
      remainingTrips: 2 - actualTrips
    });

  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check trip limit' },
      { status: 500 }
    );
  }
}