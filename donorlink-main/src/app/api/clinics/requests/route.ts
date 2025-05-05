// src/app/api/clinics/requests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BloodRequest from '@/lib/mongodb/models/bloodRequest.model';
import Clinic from '@/lib/mongodb/models/clinic.model';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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

// GET: Fetch all blood requests for a clinic
export async function GET(
  request: Request
) {
  try {
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
    
    // Fetch blood requests for this clinic
    const requests = await BloodRequest.find({ clinicEmail: user.email })
      .sort({ createdAt: -1 })  // Sort by newest first
      .lean();  // Convert to plain JavaScript object
    
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching blood requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch blood requests' },
      { status: 500 }
    );
  }
}

// POST: Create a new blood request
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const user = await getAuthenticatedUser(req);
    
    // Check if the user is authenticated and is a clinic
    if (!user || user.userType !== 'clinic') {
      return NextResponse.json(
        { message: 'Not authenticated or not a clinic' },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();
    
    // Parse the request body
    const body = await req.json();
    const { bloodType, quantity, urgency, notes } = body;
    
    // Validate required fields
    if (!bloodType || !quantity || !urgency) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Fetch the clinic details from database for security
    const clinic = await Clinic.findOne({ email: user.email });
    if (!clinic) {
      return NextResponse.json(
        { message: 'Clinic not found' },
        { status: 404 }
      );
    }
    
    // Create a new blood request with server-verified clinic details
    const bloodRequest = new BloodRequest({
      clinicId: clinic._id,
      clinicName: clinic.name,
      clinicEmail: clinic.email,
      bloodType,
      quantity: parseInt(quantity.toString()),
      urgency,
      notes,
      status: 'Active',
    });
    
    // Save the blood request
    await bloodRequest.save();
    
    // Return the created blood request
    return NextResponse.json({
      message: 'Blood request created successfully',
      request: bloodRequest,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating blood request:', error);
    return NextResponse.json(
      { message: 'Failed to create blood request' },
      { status: 500 }
    );
  }
}