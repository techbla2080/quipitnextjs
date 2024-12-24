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

export async function DELETE(request: Request) {
  try {
    const { job_id } = await request.json();
    
    if (!job_id) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    await Trip.findOneAndDelete({ jobId: job_id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
