// app/api/sendNotification/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Notification from '@/lib/mongodb/models/notification.model';
import Donor from '@/lib/mongodb/models/donor.model';
import dbConnect from '@/lib/mongodb';
import { transporter } from '@/lib/utils/mailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { donorIds, subject, message, clinicId, bloodRequestId } = body;

    await dbConnect();

    const donors = await Donor.find({ _id: { $in: donorIds } });

    for (const donor of donors) {
      const notificationData = {
        donorId: donor._id,
        clinicId,
        bloodRequestId,
        email: donor.email,
        subject,
        message,
        sentAt: new Date(),
      };

      try {
        await transporter.sendMail({
          from: `"DonorLink UAE" <${process.env.GMAIL_USER}>`,
          to: donor.email,
          subject,
          text: message,
        });

        await Notification.create({ ...notificationData, status: 'sent'});

      } catch (error) {
        console.error('Failed to send to', donor.email, error);
        await Notification.create({ ...notificationData, status: 'failed'});
      }
    }

    return NextResponse.json({ message: 'Emails sent (or logged)' }, { status: 200 });
  } catch (err) {
    console.error('Notification error:', err);
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
  }
}