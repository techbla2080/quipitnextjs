// app/api/trips/route.ts

import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

// GET: Fetch all trips for the user
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: trips, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!Array.isArray(trips)) {
      console.error("Trips is not an array:", trips);
      return NextResponse.json({ success: false, error: "No trips found" }, { status: 404 });
    }

    console.log("Trips from DB:", trips);

    let formattedTrips;
    try {
      formattedTrips = trips.map((trip: any) => ({
        id: trip.id,
        _id: trip.id,
        job_id: trip.job_id,
        location: trip.location || '',
        dateRange: trip.date_range || '',
        interests: Array.isArray(trip.interests) ? trip.interests : [],
        cities: Array.isArray(trip.cities) ? trip.cities : [],
        trip_result: trip.trip_result ?? '',
        tripResult: trip.trip_result ?? '',
        createdAt: trip.created_at || new Date().toISOString()
      }));
    } catch (err) {
      console.error("Error formatting trips:", err, trips);
      return NextResponse.json({ success: false, error: "Error formatting trips" }, { status: 500 });
    }

    return NextResponse.json({ success: true, trips: formattedTrips });
  } catch (error) {
    console.error("Unexpected error in GET /api/trips:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch trips' }, { status: 500 });
  }
}

// DELETE: Delete a trip by job_id
export async function DELETE(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { job_id } = await request.json();
    console.log("Attempting to delete trip with job_id:", job_id);

    if (!job_id) {
      return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 });
    }

    // First check if the trip exists
    const { data: existingTrip, error: checkError } = await supabase
      .from('trips')
      .select('*')
      .eq('job_id', job_id)
      .eq('user_id', userId)
      .single();

    console.log("Existing trip check:", { existingTrip, checkError });

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error checking for existing trip:", checkError);
      return NextResponse.json({ success: false, error: 'Error checking trip existence' }, { status: 500 });
    }

    if (!existingTrip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }

    // Delete the trip
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('user_id', userId)
      .eq('job_id', job_id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    console.error("Unexpected error in DELETE:", error);
    return NextResponse.json({ success: false, error: 'Failed to delete trip' }, { status: 500 });
  }
}