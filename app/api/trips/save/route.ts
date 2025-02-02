import { connectDB } from '@/lib/mongodb';
import { Trip } from '@/models/Trip';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Find or create user document with strict userId matching
      let user = await User.findOne({ userId: userId }).session(session);
      
      if (!user) {
        user = await User.create([{ 
          userId: userId, 
          tripCount: 0
        }], { session });
        user = user[0];
      }

      // Count only THIS user's trips
      const existingTrips = await Trip.countDocuments({ userId: userId }).session(session);
      
      console.log(`User ${userId} has ${existingTrips} existing trips`);
      
      if (existingTrips !== user.tripCount) {
        user.tripCount = existingTrips;
        await user.save({ session });
        console.log(`Fixed trip count for user ${userId} to ${existingTrips}`);
      }

      if (user.tripCount >= 2) {
        await session.abortTransaction();
        return NextResponse.json({
          success: false,
          error: 'Free trip limit reached',
          requiresSubscription: true,
          userTrips: user.tripCount
        }, { status: 403 });
      }

      const body = await request.json();
    
      // Save trip with explicit userId
      const trip = await Trip.create([{
        userId: userId,  // Explicit userId assignment
        location: body.location,
        cities: body.cities,
        dateRange: body.dateRange,
        interests: body.interests,
        jobId: body.jobId,
        tripResult: body.tripResult
      }], { session });

      // Update count only for this specific user
      user = await User.findOneAndUpdate(
        { userId: userId },  // Explicit userId match
        { $inc: { tripCount: 1 } },
        { session, new: true }
      );

      await session.commitTransaction();
      
      console.log(`Successfully saved trip for user ${userId}. New trip count: ${user.tripCount}`);

      return NextResponse.json({ 
        success: true, 
        trip: trip[0],
        userTrips: user.tripCount
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save trip' },
      { status: 500 }
    );
  }
}