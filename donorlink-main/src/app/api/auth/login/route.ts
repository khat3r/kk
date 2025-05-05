import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import dbConnect from '@/lib/mongodb';
import Donor from '@/lib/mongodb/models/donor.model';
import Clinic from '@/lib/mongodb/models/clinic.model';
import jwt from 'jsonwebtoken';

// Define interfaces for the document types
interface BaseDonorLink {
  _id: string;
  email: string;
  password: string;
}

interface DonorDocument extends BaseDonorLink {
  fullName: string;
  bloodType: string;
}

interface ClinicDocument extends BaseDonorLink {
  name: string;
  licenseNumber: string;
}

type UserDocument = DonorDocument | ClinicDocument;

// Set a JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const { email, password, userType } = body;
    
    if (!email || !password || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Find user based on user type
    let user: UserDocument | null = null;
    
    if (userType === 'donor') {
      user = await Donor.findOne({ email }).lean() as DonorDocument | null;
    } else if (userType === 'clinic') {
      user = await Clinic.findOne({ email }).lean() as ClinicDocument | null;
    } else {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        userType
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Determine user name based on user type
    const name = userType === 'donor' 
      ? (user as DonorDocument).fullName 
      : (user as ClinicDocument).name;
    
    // Set HTTP-only cookie with the token
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        userType,
        name
      }
    });
    
    // Set cookie with token
    response.cookies.set({
      name: 'donorlink_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 1 day in seconds
      path: '/',
    });
    
    return response;
    
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}