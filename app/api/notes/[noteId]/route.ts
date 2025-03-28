import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';

// Use mongoose model (with caching to prevent recompilation)
const Note = mongoose.models.Note;

// GET handler to retrieve a specific note by ID
export async function GET(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get user ID from Clerk auth
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const noteId = params.noteId;
    
    // Find the specific note
    const note = await Note.findOne({ _id: noteId, userId });
    
    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}