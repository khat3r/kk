// src/lib/mongodb/models/bloodRequest.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBloodRequest extends Document {
  clinicId: mongoose.Types.ObjectId;
  clinicName: string;
  clinicEmail: string;
  bloodType: string;
  quantity: number;
  urgency: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Fulfilled' | 'Cancelled' | 'Expired';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BloodRequestSchema = new Schema<IBloodRequest>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
    clinicName: {
      type: String,
      required: true,
    },
    clinicEmail: {
      type: String,
      required: true,
    },
    bloodType: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    urgency: {
      type: String,
      required: true,
      enum: ['High', 'Medium', 'Low'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Fulfilled', 'Cancelled', 'Expired'],
      default: 'Active',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate model creation during hot reloading
const BloodRequest = mongoose.models.BloodRequest as mongoose.Model<IBloodRequest> || 
  mongoose.model<IBloodRequest>('BloodRequest', BloodRequestSchema);

export default BloodRequest;