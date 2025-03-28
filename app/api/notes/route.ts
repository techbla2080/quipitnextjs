import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';

// Define the schema for a note entry
const NoteEntrySchema = new mongoose.Schema({
  originalText: {
    type: String,
    required: true
  },
  analysis: {
    type: String,
    default: ''
  },
  tag: {
    type: String,
    default: 'general'
  },
  timestamp: {
    type: String,
    default: () => new Date().toISOString()
  }
});

// Define the schema for a note document
const NoteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Untitled Note'
  },
  entries: [NoteEntrySchema],
  createdAt: {
    type: String,
    default: () => new Date().toISOString()
  },
  updatedAt: {
    type: String,
    default: () => new Date().toISOString()
  }
});

// Create indexes for faster queries
NoteSchema.index({ userId: 1 });

// Use mongoose model (with caching to prevent recompilation)
const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

// GET handler to retrieve notes (all or single)
export async function GET(request: Request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get user ID from Clerk auth
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if we're requesting a specific note
    const url = new URL(request.url);
    const noteId = url.searchParams.get('id');
    
    if (noteId) {
      // Return a specific note
      console.log(`Fetching note with ID: ${noteId}`);
      const note = await Note.findOne({ _id: noteId, userId });
      
      if (!note) {
        console.log('Note not found');
        return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
      }
      
      console.log('Note found:', note);
      return NextResponse.json({ success: true, note });
    }
    
    // Return all notes
    console.log('Fetching all notes for user');
    const notes = await Note.find({ userId }).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST handler to create a new note
export async function POST(request: Request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get user ID from Clerk auth
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { title, entry } = await request.json();
    
    if (!entry || !entry.originalText) {
      return NextResponse.json(
        { success: false, error: 'Entry content is required' },
        { status: 400 }
      );
    }
    
    // Create a new note with the first entry
    const newNote = new Note({
      userId,
      title: title || 'Untitled Note',
      entries: [entry],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    await newNote.save();
    
    return NextResponse.json(
      { success: true, note: newNote },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

// PUT handler to update an existing note
export async function PUT(request: Request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get user ID from Clerk auth
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { noteId, entry } = await request.json();
    
    if (!noteId) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }
    
    if (!entry || !entry.originalText) {
      return NextResponse.json(
        { success: false, error: 'Entry content is required' },
        { status: 400 }
      );
    }
    
    // Find the existing note
    const note = await Note.findOne({ _id: noteId, userId });
    
    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }
    
    // Add the new entry to the entries array
    note.entries.unshift(entry);
    note.updatedAt = new Date().toISOString();
    
    await note.save();
    
    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

// DELETE handler for removing a note
export async function DELETE(request: Request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get user ID from Clerk auth
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the note ID from the URL
    const url = new URL(request.url);
    const noteId = url.searchParams.get('id');
    
    if (!noteId) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }
    
    // Delete the note
    const result = await Note.findOneAndDelete({ _id: noteId, userId });
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}

// PATCH handler for note operations like rescuing or deleting entries
export async function PATCH(request: Request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get user ID from Clerk auth
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { noteId, operation, entryIndex } = await request.json();
    
    if (!noteId) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }
    
    if (!operation) {
      return NextResponse.json(
        { success: false, error: 'Operation is required' },
        { status: 400 }
      );
    }
    
    if (entryIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'Entry index is required' },
        { status: 400 }
      );
    }
    
    // Find the existing note
    const note = await Note.findOne({ _id: noteId, userId });
    
    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }
    
    // Check if the entry index is valid
    if (entryIndex < 0 || entryIndex >= note.entries.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid entry index' },
        { status: 400 }
      );
    }
    
    // Perform the operation
    switch (operation) {
      case 'rescue': {
        // Move the entry to the top
        const entryToRescue = note.entries[entryIndex];
        note.entries.splice(entryIndex, 1);
        note.entries.unshift(entryToRescue);
        break;
      }
      case 'delete': {
        // Remove the entry
        note.entries.splice(entryIndex, 1);
        break;
      }
      default: {
        return NextResponse.json(
          { success: false, error: 'Invalid operation' },
          { status: 400 }
        );
      }
    }
    
    // Update the note's updatedAt timestamp
    note.updatedAt = new Date().toISOString();
    
    await note.save();
    
    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update note' },
      { status: 500 }
    );
  }
}