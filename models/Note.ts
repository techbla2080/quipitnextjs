// models/Note.ts
import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true, // Ensure only one document per user
  },
  title: {
    type: String,
    default: 'DropThought Notes',
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
  updatedAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

NoteSchema.index({ userId: 1 });

const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

export default Note;