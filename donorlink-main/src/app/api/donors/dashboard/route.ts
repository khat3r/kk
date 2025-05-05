import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Donor from '@/lib/mongodb/models/donor.model';
import BloodRequest from '@/lib/mongodb/models/bloodRequest.model';
import Clinic from '@/lib/mongodb/models/clinic.model';
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
  donorId: Types.ObjectId;
  clinicId: {
    _id: Types.ObjectId;
    name: string;
    address: string;
    location: {
      type: string;
      coordinates: [number, number];
    };
  };
  bloodRequestId: {
    _id: Types.ObjectId;
    bloodType: string;
    urgency: 'High' | 'Medium' | 'Low';
    status: string;
  };
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'interested';
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const user = await getAuthenticatedUser(req);
    
    // Check if the user is authenticated and is a donor
    if (!user || user.userType !== 'donor') {
      return NextResponse.json(
        { message: 'Not authenticated or not a donor' },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();
    
    // Fetch donor data
    const donor = await Donor.findOne({ email: user.email });
    if (!donor) {
      return NextResponse.json(
        { message: 'Donor not found' },
        { status: 404 }
      );
    }

    // Convert to plain object to ensure we can access all fields
    const donorObj = donor.toObject();

    // Fetch notifications for this donor
    const notifications = (await Notification.find({ 
      donorId: donor._id,
      status: { $in: ['sent', 'pending', 'interested'] }  // Include interested status
    })
    .sort({ createdAt: -1 })
    .populate('clinicId', 'name address location')
    .populate('bloodRequestId', 'bloodType urgency status')
    .lean()) as unknown as PopulatedNotification[];

    // Process notifications to get blood requests
    const requestsWithDistance = await Promise.all(notifications.map(async (notification) => {
      if (!notification.bloodRequestId || !notification.clinicId) {
        return null;
      }

      const bloodRequest = notification.bloodRequestId;
      const clinic = notification.clinicId;

      if (!clinic.location || !clinic.location.coordinates) {
        return null;
      }

      // Calculate distance using the Haversine formula
      const R = 6371; // Earth's radius in km
      const lat1 = donorObj.location.coordinates[0];
      const lon1 = donorObj.location.coordinates[1];
      const lat2 = clinic.location.coordinates[0];
      const lon2 = clinic.location.coordinates[1];

      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;

      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      return {
        id: bloodRequest._id.toString(),
        clinic: clinic.name,
        bloodType: bloodRequest.bloodType,
        urgency: bloodRequest.urgency,
        location: clinic.address,
        date: notification.createdAt,
        distance: distance.toFixed(1),
        notificationId: notification._id.toString(),
        message: notification.message,
        isInterested: notification.status === 'interested'  // Add this field
      };
    }));

    // Filter out null values and sort by distance
    const validRequests = requestsWithDistance
      .filter((request): request is NonNullable<typeof request> => request !== null)
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    // Calculate eligibility
    const lastDonation = donorObj.lastDonation;
    const eligibleToDonateSince = lastDonation 
      ? new Date(lastDonation.getTime() + (56 * 24 * 60 * 60 * 1000)) // 56 days after last donation
      : new Date(0);

    // Return the dashboard data
    const responseData = {
      donorData: {
        name: donorObj.fullName,
        bloodType: donorObj.bloodType,
        lastDonation: lastDonation ? lastDonation.toISOString() : null,
        totalDonations: 0, // TODO: Implement donation counting
        eligibleToDonateSince: eligibleToDonateSince.toISOString(),
        points: donorObj.points || 0,
      },
      requests: validRequests,
      donationHistory: [], // TODO: Implement donation history
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching donor dashboard data:', error);
    return NextResponse.json(
      { message: 'Failed to fetch donor dashboard data' },
      { status: 500 }
    );
  }
} 