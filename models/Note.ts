import mongoose from 'mongoose';

// Define the schema
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
  timestamp: {
    type: String,
    default: () => new Date().toISOString()
  },
  updatedAt: {
    type: String,
    default: () => new Date().toISOString()
  }
});

// Check if the model exists already to prevent recompilation
const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

export default Note;