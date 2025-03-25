import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Note from '@/models/Note';

export async function POST(request: Request) {
  try {
    // Get the note data from the request body
    const { noteId, title, content } = await request.json();

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

    let note;

    // If noteId is provided, try to update the existing note
    if (noteId) {
      // Find the existing note
      note = await Note.findOne({ _id: noteId, userId });
      
      if (note) {
        // Add the current content to versions array
        note.versions.push({
          content: note.content,
          timestamp: note.updatedAt
        });
        
        // Update the note with new content
        note.title = title || note.title;
        note.content = content;
        note.updatedAt = new Date().toISOString();
        
        // Save the updated note
        await note.save();
      } else {
        // No note found with this ID and userId
        return NextResponse.json(
          { success: false, error: 'Note not found or unauthorized' },
          { status: 404 }
        );
      }
    } else {
      // Create a new note if no noteId is provided
      note = new Note({
        userId,
        title: title || 'Untitled Note',
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: [] // Start with empty versions array
      });
      
      await note.save();
    }

    return NextResponse.json({ 
      success: true, 
      note,
      message: noteId ? 'Note updated successfully' : 'Note created successfully'
    });
    
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save note' },
      { status: 500 }
    );
  }
}