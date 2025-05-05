import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/lib/mongodb/models/notification.model';
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

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user || user.userType !== 'donor') {
      return NextResponse.json(
        { message: 'Not authenticated or not a donor' },
        { status: 401 }
      );
    }

    const { notificationId, withdraw } = await req.json();

    if (!notificationId) {
      return NextResponse.json(
        { message: 'Notification ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return NextResponse.json(
        { message: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.donorId.toString() !== user.id) {
      return NextResponse.json(
        { message: 'Unauthorized to update this notification' },
        { status: 403 }
      );
    }

    notification.status = withdraw ? 'sent' : 'interested';
    await notification.save();

    return NextResponse.json({ 
      message: withdraw ? 'Interest withdrawn successfully' : 'Interest expressed successfully',
      status: notification.status
    });
  } catch (error) {
    console.error('Error updating interest:', error);
    return NextResponse.json(
      { message: 'Failed to update interest' },
      { status: 500 }
    );
  }
} 