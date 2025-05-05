import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/lib/mongodb/models/notification.model';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { Types } from 'mongoose';

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

interface PopulatedNotification {
  _id: Types.ObjectId;
  donorId: {
    _id: Types.ObjectId;
    fullName: string;
    phoneNumber: string;
    email: string;
    bloodType: string;
  };
  bloodRequestId: {
    _id: Types.ObjectId;
    bloodType: string;
    urgency: 'High' | 'Medium' | 'Low';
    status: string;
  };
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
}

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

    // Fetch notifications for this clinic
    const notifications = (await Notification.find({ 
      clinicId: user.id,
    })
    .sort({ createdAt: -1 })
    .populate({
      path: 'donorId',
      select: 'fullName phoneNumber email bloodType',
      model: 'Donor'
    })
    .populate('bloodRequestId', 'bloodType urgency status')
    .lean()) as unknown as PopulatedNotification[];

    // Transform the data for the frontend
    const donorRequests = notifications
      .filter(notification => notification.donorId && notification.bloodRequestId) // Filter out notifications with missing data
      .map(notification => ({
        id: notification._id.toString(),
        bloodRequestId: notification.bloodRequestId._id.toString(),
        bloodType: notification.bloodRequestId.bloodType,
        urgency: notification.bloodRequestId.urgency,
        donorName: notification.donorId.fullName,
        donorPhone: notification.donorId.phoneNumber,
        donorEmail: notification.donorId.email,
        donorBloodType: notification.donorId.bloodType,
        status: notification.status,
        createdAt: notification.createdAt
      }));

    return NextResponse.json({
      donorRequests
    });
  } catch (error) {
    console.error('Error fetching clinic donor requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch clinic donor requests' },
      { status: 500 }
    );
  }
} 