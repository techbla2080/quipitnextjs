import { connectDB } from '@/lib/mongodb';
import { Trip } from '@/models/Trip';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const trips = await Trip.find({}).sort({ createdAt: -1 });
    
    console.log('Fetched trips count:', trips.length); // Debug log
    
    return NextResponse.json({ 
      success: true, 
      trips: trips || [] 
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

// app/api/trips/route.ts
// Keep your existing GET function

export async function DELETE(request: Request) {
    try {
      await connectDB();
      
      // Get job_id from URL
      const { searchParams } = new URL(request.url);
      const jobId = searchParams.get('job_id');
  
      console.log('Attempting to delete trip with jobId:', jobId); // Debug log
  
      if (!jobId) {
        return NextResponse.json(
          { success: false, error: 'No job_id provided' },
          { status: 400 }
        );
      }
  
      const result = await Trip.deleteOne({ jobId: jobId });
      console.log('Delete result:', result); // Debug log
  
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Trip not found' },
          { status: 404 }
        );
      }
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting trip:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete trip' },
        { status: 500 }
      );
    }
  }