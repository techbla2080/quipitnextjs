import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

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
      trip_result: body.tripResult || ''
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