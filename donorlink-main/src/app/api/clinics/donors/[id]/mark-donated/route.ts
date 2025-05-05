import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/lib/mongodb/models/notification.model';
import Donor from '@/lib/mongodb/models/donor.model';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('donorlink_token');
    
    if (!tokenCookie) {
      return null;
    }
    
    const token = tokenCookie.value;
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

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Extract the id from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // [id] is the second last part

    // Get authenticated user
    const user = await getAuthenticatedUser(request as NextRequest);
    if (!user || user.userType !== 'clinic') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the notification and update its status
    const notification = await Notification.findById(id);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update notification status
    notification.status = 'donated';
    await notification.save();

    // Update donor's points using findOneAndUpdate for atomic operation
    const updatedDonor = await Donor.findOneAndUpdate(
      { _id: notification.donorId },
      [
        {
          $set: {
            points: {
              $add: [
                { $ifNull: ["$points", 0] },
                100
              ]
            }
          }
        }
      ],
      { new: true } // Return the updated document
    );

    if (!updatedDonor) {
      console.error(`Donor not found for ID: ${notification.donorId}`);
    } else {
      console.log(`Updated points for donor ${updatedDonor._id}: ${updatedDonor.points}`);
    }

    return NextResponse.json(
      { message: 'Successfully marked as donated and points awarded' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking donation:', error);
    return NextResponse.json(
      { error: 'Failed to mark donation' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  // Use the same logic as POST
  return POST(request);
} 