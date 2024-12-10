// app/models/Trip.ts
import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  job_id: String,
  location: String,
  dateRange: String,
  interests: String,
  cities: String,
  content: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Trip = mongoose.models.Trip || mongoose.model('Trip', TripSchema);