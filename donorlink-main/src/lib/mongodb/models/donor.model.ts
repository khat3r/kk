// src/lib/mongodb/models/donor.model.ts

import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IDonor extends Document {
  fullName: string;
  email: string;
  password: string;
  bloodType: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string;
  phoneNumber: string;
  lastDonation?: Date;
  points: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const DonorSchema = new Schema<IDonor>(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    bloodType: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [latitude, longitude]
        required: true,
      },
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    lastDonation: {
      type: Date,
    },
    points: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create a geospatial index for location-based queries
DonorSchema.index({ location: '2dsphere' });

// Password comparison method
DonorSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hash password before saving
DonorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Prevent duplicate model creation during hot reloading
const Donor = mongoose.models.Donor as mongoose.Model<IDonor> || 
  mongoose.model<IDonor>('Donor', DonorSchema);

export default Donor;