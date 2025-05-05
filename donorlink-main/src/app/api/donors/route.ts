import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Donor from '@/lib/mongodb/models/donor.model';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Extract data from request
    const { 
      fullName, 
      email, 
      phoneNumber, 
      phone,
      bloodType, 
      location,
      longitude,
      latitude,
      address,
      password,
      eligibilityQuiz
    } = body;
    
    // Validate required fields
    if (!fullName || !email || !(phoneNumber || phone) || !bloodType || !password || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if donor already exists
    const existingDonor = await Donor.findOne({ email });
    
    if (existingDonor) {
      return NextResponse.json(
        { error: 'A donor with this email already exists' },
        { status: 409 }
      );
    }
    
    // Create donor data object
    const donorData = {
      fullName,
      email,
      phoneNumber: phoneNumber || phone,
      bloodType,
      password,
      address,
      // Use either the location object or create one from longitude/latitude
      location: location || {
        type: 'Point',
        coordinates: [
          parseFloat(latitude), 
          parseFloat(longitude)
        ]
      },
      // Include longitude and latitude as separate fields if they exist
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      // Include phone as a separate field if it exists
      phone: phone || phoneNumber,
      // Include eligibility quiz data
      eligibilityQuiz
    };
    
    // Create new donor
    const donor = await Donor.create(donorData);
    
    // Return success without including password
    return NextResponse.json({ 
      success: true,
      donor: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        bloodType: donor.bloodType
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Donor registration error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A donor with this email already exists' },
        { status: 409 }
      );
    }
    
    // Return validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          error: 'Donor validation failed',
          details: error.message
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}