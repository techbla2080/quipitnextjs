// app/api/trips/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Trip } from '@/models/Trip';

export async function POST(req: Request) {
 try {
   await connectToDatabase();
   
   const data = await req.json();
   
   const tripData = {
     job_id: data.job_id,
     location: data.location,
     dateRange: data.dateRange,
     interests: data.interests,
     cities: data.cities,
     content: data.content
   };

   const existingTrip = await Trip.findOne({ job_id: tripData.job_id });

   let trip;
   if (existingTrip) {
     trip = await Trip.findOneAndUpdate(
       { job_id: tripData.job_id },
       tripData,
       { new: true }
     );
   } else {
     trip = await Trip.create(tripData);
   }

   return NextResponse.json({ success: true, trip });

 } catch (error) {
   console.error('Error saving trip:', error);
   return NextResponse.json({ success: false, error: 'Failed to save trip' });
 }
}

export async function GET() {
 try {
   await connectToDatabase();
   const trips = await Trip.find().sort({ createdAt: -1 });
   return NextResponse.json({ success: true, trips });
 } catch (error) {
   console.error('Error fetching trips:', error);
   return NextResponse.json({ success: false, error: 'Failed to fetch trips' });
 }
}

export async function DELETE(req: Request) {
 try {
   await connectToDatabase();
   const { searchParams } = new URL(req.url);
   const job_id = searchParams.get('job_id');

   if (!job_id) {
     return NextResponse.json({ success: false, error: 'Job ID is required' });
   }

   const result = await Trip.deleteOne({ job_id });

   if (result.deletedCount === 0) {
     return NextResponse.json({ success: false, error: 'Trip not found' });
   }

   return NextResponse.json({ success: true, message: 'Trip deleted successfully' });
 } catch (error) {
   console.error('Error deleting trip:', error);
   return NextResponse.json({ success: false, error: 'Failed to delete trip' });
 }
}