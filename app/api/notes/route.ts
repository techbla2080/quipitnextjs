import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Note from '@/models/Note';

export async function GET(request: Request) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    
    // If userId is not in query params, try to get it from auth
    if (!userId) {
      const { userId: authUserId } = auth();
      userId = authUserId;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();
    
    // Fetch notes for this user, sorted by timestamp
    const notes = await Note.find({ userId })
      .sort({ timestamp: -1 })
      .lean();

    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}