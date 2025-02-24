import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  tripCount: number;
  subscriptionStatus: 'free' | 'pro';
  subscriptionUpdatedAt: Date;
  createdAt: Date;
  subscriptionStartDate?: Date; // When the subscription started
  subscriptionEndDate?: Date;   // When the subscription expires
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  tripCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  subscriptionStatus: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  subscriptionUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  subscriptionStartDate: {
    type: Date, // Optional field, only set when subscription is active
  },
  subscriptionEndDate: {
    type: Date, // Optional field, only set when subscription is active
  },
});

// Keep existing pre-save hook
userSchema.pre<IUser>('save', function (next) {
  if (this.tripCount < 0) {
    this.tripCount = 0;
  }
  next();
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);