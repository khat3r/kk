// src/lib/utils/donorMatching.ts

import Donor from '@/lib/mongodb/models/donor.model';
import Clinic from '@/lib/mongodb/models/clinic.model';
import BloodRequest from '@/lib/mongodb/models/bloodRequest.model';

// Blood compatibility chart (recipient → compatible donor types)
const BLOOD_COMPATIBILITY = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal recipient
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'], // Universal donor
};

export interface MatchedDonor {
  id: string;
  fullName: string;
  bloodType: string;
  distance: number; // in kilometers
  email: string;
  phoneNumber: string;
  lastDonation?: Date;
}

export async function findNearbyDonors(
  requestId: string,
  maxDistanceKm: number = 20
): Promise<MatchedDonor[]> {
  try {
    // Get the blood request details
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      throw new Error('Blood request not found');
    }

    // Get the clinic's location
    const clinic = await Clinic.findById(bloodRequest.clinicId);
    if (!clinic || !clinic.location || !clinic.location.coordinates) {
      throw new Error('Clinic location not found');
    }

    // Get compatible blood types for the requested type
    const compatibleTypes = BLOOD_COMPATIBILITY[bloodRequest.bloodType as keyof typeof BLOOD_COMPATIBILITY];
    if (!compatibleTypes) {
      throw new Error('Invalid blood type');
    }

    // Convert km to meters for MongoDB's $geoNear
    const maxDistanceMeters = maxDistanceKm * 1000;

    // Find nearby donors with compatible blood types
    const nearbyDonors = await Donor.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: clinic.location.coordinates,
          },
          distanceField: 'distance', // This will contain the calculated distance
          maxDistance: maxDistanceMeters,
          spherical: true,
        },
      },
      {
        $match: {
          bloodType: { $in: compatibleTypes },
        },
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          bloodType: 1,
          email: 1,
          phoneNumber: 1,
          lastDonation: 1,
          // Convert distance from meters to kilometers
          distance: { $divide: ['$distance', 1000] },
        },
      },
      {
        $sort: { distance: 1 }, // Sort by nearest first
      },
    ]);

    // Transform the results
    return nearbyDonors.map((donor) => ({
      id: donor._id.toString(),
      fullName: donor.fullName,
      bloodType: donor.bloodType,
      distance: parseFloat(donor.distance.toFixed(2)), // Round to 2 decimal places
      email: donor.email,
      phoneNumber: donor.phoneNumber,
      lastDonation: donor.lastDonation,
    }));
  } catch (error) {
    console.error('Error finding nearby donors:', error);
    throw error;
  }
}