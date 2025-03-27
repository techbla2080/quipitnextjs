// app/api/notes/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';
import Note from '@/models/Note';

export async function POST(request: Request) {
  try {
    // Get the note data from the request body
    console.log('Received request body:', await request.json());
    const { content } = await request.json();
    console.log('Parsed content:', content);

    // Get user ID from Clerk auth
    console.log('Attempting to authenticate user...');
    const { userId } = auth();
    console.log('User ID from auth:', userId);
    
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
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected to MongoDB');

    // Find the user's existing note document
    console.log('Finding note for user:', userId);
    let note = await Note.findOne({ userId });
    console.log('Found note:', note);

    const timestamp = new Date().toISOString();
    console.log('Timestamp:', timestamp);
    
    if (note) {
      // Store the current content in the versions array
      console.log('Pushing current content to versions:', note.content);
      note.versions.push({
        content: note.content,
        timestamp: timestamp,
      });

      // Append the new content to the existing note with a timestamp separator
      const updatedContent = `${note.content}\n\n--- Entry added on ${timestamp} ---\n\n${content}`;
      note.content = updatedContent;
      note.updatedAt = timestamp;
      console.log('Updated note content:', updatedContent);

      // Save the updated note
      console.log('Saving updated note...');
      await note.save();
      console.log('Note saved successfully');
    } else {
      // Create a new note document if none exists for the user
      console.log('Creating new note for user:', userId);
      note = new Note({
        userId,
        title: 'DropThought Notes',
        content: content,
        timestamp: timestamp,
        updatedAt: timestamp,
        versions: [],
      });

      // Save the new note
      console.log('Saving new note...');
      await note.save();
      console.log('New note saved successfully');
    }

    return NextResponse.json({ 
      success: true, 
      note,
      message: 'Note updated successfully',
    });
    
  } catch (error: unknown) { // Changed from error: Error to error: unknown
    console.error('Error saving note:', error);
    console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    // Type guard to safely access error.message
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
    console.log('Attempting to authenticate user for GET...');
    const { userId } = auth();
    console.log('User ID from auth for GET:', userId);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB for GET...');
    await connectDB();
    console.log('Connected to MongoDB for GET');

    // Find the user's note document
    console.log('Finding note for user:', userId);
    const note = await Note.findOne({ userId }).lean();
    console.log('Found note for GET:', note);

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, note });
  } catch (error: unknown) { // Changed from error: Error to error: unknown
    console.error('Error fetching note:', error);
    console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    // Type guard to safely access error.message
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch note';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}