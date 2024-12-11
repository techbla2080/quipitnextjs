// models/Trip.ts
import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  location: String,
  cities: [String],
  dateRange: String,
  interests: [String],
  jobId: String,
  tripResult: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  },
  userId: String
});

export const Trip = mongoose.models.Trip || mongoose.model('Trip', TripSchema);