import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  job_id: { 
    type: String, 
    required: true,
    unique: true 
  },
  location: {
    type: String,
    required: true
  },
  dateRange: {
    type: String,
    required: true
  },
  interests: String,
  cities: String,
  content: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Trip = mongoose.models.Trip || mongoose.model('Trip', TripSchema);