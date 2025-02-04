import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tripCount: {
    type: Number,
    default: 0,
    min: 0
  },
  subscriptionStatus: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  },
  subscriptionUpdatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Keep existing pre-save hook
userSchema.pre('save', function(next) {
  if (this.tripCount < 0) {
    this.tripCount = 0;
  }
  next();
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);