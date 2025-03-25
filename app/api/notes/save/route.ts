import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';
import Note from '@/models/Note';

export async function POST(request: Request) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Get user ID
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request data
    const { noteId, title, content } = await request.json();
    
    if (!content) {
      return NextResponse.json({ success: false, error: 'Content required' }, { status: 400 });
    }
    
    if (noteId) {
      // Find the existing note first
      const existingNote = await Note.findOne({ _id: noteId, userId });
      
      if (!existingNote) {
        return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
      }
      
      // Append new content to existing content with a timestamp separator
      const timestamp = new Date().toISOString();
      const updatedContent = `${existingNote.content}\n\n--- Entry added on ${timestamp} ---\n\n${content}`;
      
      // Update the note with appended content
      existingNote.content = updatedContent;
      existingNote.title = title || existingNote.title;
      existingNote.updatedAt = timestamp;
      
      await existingNote.save();
      return NextResponse.json({ success: true, note: existingNote });
      
    } else {
      // Create new note
      const newNote = new Note({
        userId,
        title: title || 'Untitled Note',
        content,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      await newNote.save();
      return NextResponse.json({ success: true, note: newNote });
    }
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}