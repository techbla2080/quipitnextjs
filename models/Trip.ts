// models/Trip.ts
import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  location: String,
  cities: [String],
  dateRange: String,
  interests: [String],
  jobId: String,
  tripResult: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);