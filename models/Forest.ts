// models/Forest.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IForestMessage {
  userId: string;
  message: string;
  timestamp: Date;
}

export interface IForest extends Document {
  name: string;
  userIds: string[];
  messages: IForestMessage[];
}

const ForestSchema: Schema = new Schema({
  name: { type: String, required: true },
  userIds: { type: [String], default: [] },
  messages: [{ userId: String, message: String, timestamp: Date }],
});

export default mongoose.models.Forest || mongoose.model<IForest>('Forest', ForestSchema);