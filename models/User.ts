// models/User.ts
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,  // This ensures each userId can only exist once
    index: true    // This speeds up queries by userId
  },
  tripCount: {
    type: Number,
    default: 0,
    min: 0        // Prevents negative trip counts
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add a pre-save hook to ensure tripCount is never negative
userSchema.pre('save', function(next) {
  if (this.tripCount < 0) {
    this.tripCount = 0;
  }
  next();
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);