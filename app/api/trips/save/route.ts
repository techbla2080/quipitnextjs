import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Backend received body:", body);

    // Ensure jobId exists
    if (!body.jobId) {
      return NextResponse.json({ success: false, error: 'Missing job_id' }, { status: 400 });
    }

    // Check subscription limits before saving
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

    // Get actual trip count from Supabase
    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);
    
    const actualTripCount = trips?.length || 0;

    // Check if user can create more trips
    if (user.subscriptionStatus === 'free' && actualTripCount >= 1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Trip limit reached. Upgrade to Pro for unlimited trips.',
        limitReached: true,
        currentTrips: actualTripCount,
        limit: 1
      }, { status: 403 });
    }

    // Check if a trip with this job_id already exists
    const { data: existingTrip, error: checkError } = await supabase
      .from('trips')
      .select('id')
      .eq('job_id', body.jobId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Check error:', checkError);
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 });
    }
    
    // If the trip already exists, return success
    if (existingTrip) {
      return NextResponse.json({ 
        success: true, 
        message: 'Trip already exists',
        trip: existingTrip 
      });
    }

    // Prepare the trip data for a new insert
    const tripData = {
      user_id: userId,
      location: body.location || '',
      cities: Array.isArray(body.cities) ? body.cities : [],
      date_range: body.dateRange || '',
      interests: Array.isArray(body.interests) ? body.interests : [],
      job_id: body.jobId,
      trip_result: body.trip_result || body.tripResult || ''
    };

    console.log("Saving new trip with data:", tripData);

    // Insert the new trip
    const { data, error } = await supabase
      .from('trips')
      .insert([tripData])
      .select();

    if (error) {
      console.error('Save error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, trip: data && data[0] });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save trip' }, { status: 500 });
  }
}