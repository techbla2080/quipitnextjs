// models/Tree.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITree extends Document {
  userId: string;
  points: number;
  level: number;
}

const TreeSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
});

export default mongoose.models.Tree || mongoose.model<ITree>('Tree', TreeSchema);