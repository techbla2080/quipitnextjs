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

// Create an index for faster queries
NoteSchema.index({ userId: 1 });

// Simple method for updating existing notes
NoteSchema.statics.findByIdAndUpdate = async function(id, userId, updateData) {
  // First try to find the note
  const note = await this.findOne({ _id: id, userId });
  
  if (!note) {
    return null;
  }
  
  // Update the note
  Object.assign(note, {
    ...updateData,
    updatedAt: new Date().toISOString()
  });
  
  // Save it back to the database
  return await note.save();
};

// Check if the model exists already to prevent recompilation
const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

export default Note;