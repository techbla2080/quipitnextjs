import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!['free', 'pro'].includes(status)) {
      return NextResponse.json({ error: "Invalid subscription status" }, { status: 400 });
    }

    await connectDB();
    
    const user = await User.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          subscriptionStatus: status,
          subscriptionUpdatedAt: new Date()
        } 
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}