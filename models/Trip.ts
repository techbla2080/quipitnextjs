import mongoose from 'mongoose';

// models/Trip.ts
const TripSchema = new mongoose.Schema({
  location: String,
  cities: [String],
  dateRange: String,
  interests: [String],
  jobId: { 
    type: String,
    required: true,
    unique: true
  },
  tripResult: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Trip = mongoose.models.Trip || mongoose.model('Trip', TripSchema);