// app/api/notes/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';
import Note from '@/models/Note';

export async function POST(request: Request) {
  try {
    // Get the note data from the request body
    const { content } = await request.json();

    // Get user ID from Clerk auth
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Find the user's existing note document
    let note = await Note.findOne({ userId });
    const timestamp = new Date().toISOString();
    
    if (note) {
      // Append the new content to the existing note with a timestamp separator
      const updatedContent = `${note.content}\n\n--- Entry added on ${timestamp} ---\n\n${content}`;
      note.content = updatedContent;
      note.updatedAt = timestamp;
      await note.save();
    } else {
      // Create a new note document if none exists for the user
      note = new Note({
        userId,
        title: 'DropThought Notes',
        content: content,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      await note.save();
    }

    return NextResponse.json({ 
      success: true, 
      note,
      message: 'Note updated successfully',
    });
    
  } catch (error: unknown) {
    console.error('Error saving note:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save note';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get user ID from Clerk auth
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No user ID found' }, { status: 401 });
    }

    // Connect to MongoDB
    await connectDB();
    
    // Find the user's note document
    const note = await Note.findOne({ userId }).lean();

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, note });
  } catch (error: unknown) {
    console.error('Error fetching note:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch note';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}