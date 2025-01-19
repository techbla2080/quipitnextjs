import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
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
    
    // If no user found, create one
    if (!user) {
      user = await User.create({ 
        userId, 
        tripCount: 0
      });
    }

    // Check if they can create more trips (limit is 2)
    const canCreate = user.tripCount < 2;

    return NextResponse.json({
      success: true,
      canCreate,
      tripCount: user.tripCount,
      remainingTrips: 2 - user.tripCount
    });

  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check trip limit' },
      { status: 500 }
    );
  }
}