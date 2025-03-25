// app/api/notes/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const notes = await db
      .collection('notes')
      .find({ userId })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// app/api/notes/[id]/route.ts
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const noteId = params.id;

    if (!noteId) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    let query = {};
    
    // Try to convert to ObjectId if it looks like a MongoDB ID
    if (/^[0-9a-fA-F]{24}$/.test(noteId)) {
      query = { _id: new ObjectId(noteId) };
    } else {
      query = { id: noteId };
    }

    const note = await db.collection('notes').findOne(query);

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

// app/api/notes/save/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { userId, title, content, timestamp, noteId } = await request.json();

    if (!userId || !content) {
      return NextResponse.json(
        { success: false, error: 'User ID and content are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Create a new document for insertion/update
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
      let query = {};
      
      // Try to convert to ObjectId if it looks like a MongoDB ID
      if (/^[0-9a-fA-F]{24}$/.test(noteId)) {
        query = { _id: new ObjectId(noteId) };
      } else {
        query = { id: noteId };
      }
      
      result = await db.collection('notes').updateOne(
        query,
        { $set: noteDoc }
      );
      
      if (result.matchedCount === 0) {
        // If no document matched, insert as new
        result = await db.collection('notes').insertOne(noteDoc);
        return NextResponse.json({ 
          success: true, 
          id: result.insertedId.toString(),
          noteId: result.insertedId.toString(),
          message: 'Note created successfully' 
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        id: noteId,
        noteId,
        message: 'Note updated successfully' 
      });
    } else {
      // Insert new note
      result = await db.collection('notes').insertOne(noteDoc);
      
      return NextResponse.json({ 
        success: true, 
        id: result.insertedId.toString(),
        noteId: result.insertedId.toString(),
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

// lib/mongodb.ts
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'quipit';

// Check the MongoDB URI
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Cache the MongoDB connection
let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  // If the database connection is cached, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // If no connection, create a new one
  const client = await MongoClient.connect(MONGODB_URI);

  const db = client.db(MONGODB_DB);

  // Cache the client and db for reuse
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}