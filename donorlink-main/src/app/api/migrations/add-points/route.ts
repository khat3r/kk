import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Donor from '@/lib/mongodb/models/donor.model';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // First, get all donors
    const donors = await Donor.find({});
    console.log(`Found ${donors.length} donors`);

    // Update each donor individually
    for (const donor of donors) {
      if (donor.points === undefined) {
        donor.points = 0;
        await donor.save();
        console.log(`Updated donor ${donor._id} with points: ${donor.points}`);
      }
    }

    return NextResponse.json({
      message: 'Successfully updated donor points',
      donorsUpdated: donors.length
    });
  } catch (error) {
    console.error('Error updating donor points:', error);
    return NextResponse.json(
      { error: 'Failed to update donor points' },
      { status: 500 }
    );
  }
} 