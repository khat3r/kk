// app/api/notificationHistory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Notification from '@/lib/mongodb/models/notification.model';
import dbConnect from '@/lib/mongodb';
import { transporter } from '@/lib/utils/mailer';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const allHistory = await Notification.find({})
      .sort({ createdAt: -1 })
      .lean();

    if (!allHistory || allHistory.length === 0) {
      return new NextResponse('No notification history found', { status: 404 });
    }

    return NextResponse.json(allHistory);
  } catch (error) {
    console.error('Error fetching all notification history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
