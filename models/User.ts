import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  tripCount: {
    type: Number,
    default: 0
  }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);