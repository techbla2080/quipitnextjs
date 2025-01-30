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
    
    // Find user and get their current state
    const user = await User.findOne({ userId });
    
    // Reset trip count if needed
    if (user && user.tripCount > 0) {
      await User.findOneAndUpdate(
        { userId },
        { $set: { tripCount: 0 } },
        { new: true }
      );
    }
    
    return NextResponse.json({
      success: true,
      before: user,
      after: await User.findOne({ userId }),
      message: "Trip count reset if needed"
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check/reset user' },
      { status: 500 }
    );
  }
}