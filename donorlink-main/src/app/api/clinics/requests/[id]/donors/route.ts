// src/app/api/clinics/requests/[id]/donors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BloodRequest from '@/lib/mongodb/models/bloodRequest.model';
import Clinic from '@/lib/mongodb/models/clinic.model';
import Donor from '@/lib/mongodb/models/donor.model';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';

// JWT secret (use the same one as in your login route)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Helper function to get the authenticated user from cookie
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('donorlink_token');
    
    if (!tokenCookie) {
      return null;
    }
    
    const token = tokenCookie.value;
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      userType: 'donor' | 'clinic';
    };
    
    return decoded;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// Blood compatibility chart (recipient → compatible donor types)
const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal recipient
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'], // Universal donor
};

export async function GET(request: Request) {
  try {
    // Extract the id from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const requestId = pathParts[pathParts.length - 2]; // [id] is the second last part
    console.log("Received ID:", requestId);
    
    // Get the authenticated user
    const user = await getAuthenticatedUser(request as NextRequest);
    
    // Check if the user is authenticated and is a clinic
    if (!user || user.userType !== 'clinic') {
      return NextResponse.json(
        { message: 'Not authenticated or not a clinic' },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();
    
    // Try to find the blood request directly by ID first
    let bloodRequest;
    
    try {
      // Check if the ID is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(requestId)) {
        bloodRequest = await BloodRequest.findOne({
          _id: new mongoose.Types.ObjectId(requestId),
          clinicEmail: user.email
        }).lean();
      }
    } catch (err) {
      console.error("Error finding blood request by ID:", err);
    }
    
    // If not found by direct ID, try the partial matching approach
    if (!bloodRequest) {
      const bloodRequests = await BloodRequest.find({
        clinicEmail: user.email
      }).lean();
      
      bloodRequest = bloodRequests.find(request => 
        request._id.toString().includes(requestId)
      );
    }
    
    if (!bloodRequest) {
      return NextResponse.json(
        { message: 'Blood request not found or access denied' },
        { status: 404 }
      );
    }
    
    console.log("Found request:", bloodRequest._id.toString());
    
    // Get the clinic's details for location
    const clinic = await Clinic.findById(bloodRequest.clinicId).lean();
    
    // Check if clinic exists
    if (!clinic) {
      return NextResponse.json(
        { message: 'Clinic not found' },
        { status: 404 }
      );
    }
    
    // Check if the clinic has location data
    // Access location from the coordinates array [longitude, latitude]
    if (!clinic.location || !clinic.location.coordinates || clinic.location.coordinates.length !== 2) {
      return NextResponse.json(
        { message: 'Clinic location data is missing or invalid' },
        { status: 400 }
      );
    }
    
    // Extract longitude and latitude from location.coordinates
    const clinicLongitude = clinic.location.coordinates[0];
    const clinicLatitude = clinic.location.coordinates[1];
    
    // Parse the max distance from query params (default to 20km)
    const searchParams = url.searchParams;
    const maxDistance = parseInt(searchParams.get('maxDistance') || '20');
    
    // Get compatible blood types for the requested type
    const compatibleTypes = BLOOD_COMPATIBILITY[bloodRequest.bloodType] || [];
    
    if (compatibleTypes.length === 0) {
      return NextResponse.json(
        { message: 'Invalid blood type in request' },
        { status: 400 }
      );
    }
    
    // Find all donors with compatible blood types
    const compatibleDonors = await Donor.find({
      bloodType: { $in: compatibleTypes },
    }).lean();
    
    // Calculate distances manually
    const donorsWithDistance = compatibleDonors.map(donor => {
      // Make sure donor has location data
      if (!donor.location || !donor.location.coordinates || donor.location.coordinates.length !== 2) {
        return null;
      }
      
      // Extract longitude and latitude from donor.location.coordinates
      const donorLongitude = donor.location.coordinates[0];
      const donorLatitude = donor.location.coordinates[1];
      
      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        clinicLatitude, clinicLongitude,
        donorLatitude, donorLongitude
      );
      
      // Only include donors within the maxDistance
      if (distance <= maxDistance) {
        return {
          id: donor._id.toString(),
          fullName: donor.fullName,
          bloodType: donor.bloodType,
          distance: parseFloat(distance.toFixed(2)), // Round to 2 decimal places
          email: donor.email,
          phoneNumber: donor.phoneNumber,
          lastDonation: donor.lastDonation,
        };
      }
      return null;
    }).filter(donor => donor !== null) as Array<{
      id: string;
      fullName: string;
      bloodType: string;
      distance: number;
      email: string;
      phoneNumber: string;
      lastDonation?: Date;
    }>;
    
    // Sort by distance (nearest first)
    const sortedDonors = donorsWithDistance.sort((a, b) => a.distance - b.distance);
    
    return NextResponse.json({
      bloodRequest: {
        id: bloodRequest._id.toString(),
        bloodType: bloodRequest.bloodType,
        quantity: bloodRequest.quantity,
        urgency: bloodRequest.urgency,
        status: bloodRequest.status,
      },
      nearbyDonors: sortedDonors,
      totalDonors: sortedDonors.length,
    });
  } catch (error) {
    console.error('Error finding nearby donors:', error);
    // No params.id anymore, so just log the URL
    console.error('Request URL:', request.url);
    
    return NextResponse.json(
      { message: 'Failed to find nearby donors: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two points on Earth
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}