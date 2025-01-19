import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

const FREE_TRIP_LIMIT = 2;

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
        tripCount: 0
      });
    }

    const canCreate = user.tripCount < FREE_TRIP_LIMIT;
    const remainingTrips = FREE_TRIP_LIMIT - user.tripCount;

    return NextResponse.json({
      success: true,
      canCreate,
      remainingTrips,
      tripCount: user.tripCount
    });

  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check trip limit' },
      { status: 500 }
    );
  }
}