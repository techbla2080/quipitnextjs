// models/Note.ts
import mongoose from 'mongoose';

const NoteEntrySchema = new mongoose.Schema({
  originalText: {
    type: String,
    required: [true, 'Original text is required'],
  },
  analysis: {
    type: String,
    default: '',
  },
  tag: {
    type: String,
    default: 'general',
  },
  timestamp: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

const NoteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  entries: [NoteEntrySchema], // Array of note entries
  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
  updatedAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

export default Note;