import mongoose from 'mongoose';

// Define schema for version history
const VersionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: String,
    default: () => new Date().toISOString()
  }
});

// Define the note schema
const NoteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    default: 'Untitled Note'
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString()
  },
  updatedAt: {
    type: String,
    default: () => new Date().toISOString()
  },
  // Store all versions/edits of this note
  versions: [VersionSchema]
});

// Create indexes for faster queries
NoteSchema.index({ userId: 1 });

// Check if the model exists already to prevent recompilation
const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

export default Note;