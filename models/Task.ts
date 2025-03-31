// models/Task.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  userId: string;
  title: string;
  status: string;
  points: number;
  createdAt: Date;
}

const TaskSchema: Schema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  status: { type: String, default: 'pending' },
  points: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);