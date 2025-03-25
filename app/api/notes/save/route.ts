import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Note from '@/models/Note';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    // Get data from request body
    const body = await request.json();
    let { userId, title, content, timestamp, noteId } = body;
    
    // If userId is not provided, try to get it from auth
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

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();
    
    // Create note document
    const noteDoc = {
      userId,
      title: title || 'Untitled Note',
      content,
      timestamp: timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let result;

    // If noteId is provided, update existing note
    if (noteId) {
      try {
        result = await Note.findByIdAndUpdate(
          noteId,
          noteDoc,
          { new: true, upsert: true }
        );
        
        return NextResponse.json({ 
          success: true, 
          id: result._id.toString(),
          noteId: result._id.toString(),
          message: 'Note updated successfully' 
        });
      } catch (updateError) {
        console.error('Update error:', updateError);
        
        // If update fails, create a new note
        result = await Note.create(noteDoc);
        
        return NextResponse.json({ 
          success: true, 
          id: result._id.toString(),
          noteId: result._id.toString(),
          message: 'Note created successfully' 
        });
      }
    } else {
      // Insert new note
      result = await Note.create(noteDoc);
      
      return NextResponse.json({ 
        success: true, 
        id: result._id.toString(),
        noteId: result._id.toString(),
        message: 'Note created successfully' 
      });
    }
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save note' },
      { status: 500 }
    );
  }
}