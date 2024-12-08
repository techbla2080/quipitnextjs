import { ObjectId } from "mongodb";

export interface Trip {
  _id?: ObjectId;
  job_id: string;
  location: string;
  dateRange: string;
  interests: string;
  cities: string;
  content: any;
  createdAt: Date;
  updatedAt: Date;
}
