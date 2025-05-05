// app/request_details/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface NearbyDonor {
  id: string;
  fullName: string;
  bloodType: string;
  distance: number;
  email: string;
  phoneNumber: string;
  lastDonation?: string;
  selected?: boolean;
  notifyStatus?: 'Sent' | 'Not Sent';
}

interface BloodRequestDetails {
  id: string;
  bloodType: string;
  quantity: number;
  urgency: string;
  status: string;
}

export default function RequestDetailsPage() {
  // Use useParams hook to get the id
  const params = useParams();
  const id = params.id as string;
  
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bloodRequest, setBloodRequest] = useState<BloodRequestDetails | null>(null);
  const [nearbyDonors, setNearbyDonors] = useState<NearbyDonor[]>([]);
  const [maxDistance, setMaxDistance] = useState(20);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if not logged in or not a clinic
  useEffect(() => {
    if (!loading && (!user || user.userType !== 'clinic')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch blood request and nearby donors
  useEffect(() => {
    if (!user || user.userType !== 'clinic') return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/clinics/requests/${id}/donors?maxDistance=${maxDistance}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to fetch data');
        }
        
        const data = await response.json();
        setBloodRequest(data.bloodRequest);

      // Fetch ALL notification history (not scoped to requestId)
      const historyRes = await fetch('/api/notificationHistory');
      const historyData = historyRes.ok ? await historyRes.json() : [];

      // Filter to only notifications related to this blood request
      const requestHistory = historyData.filter(
        (entry: { bloodRequestId: string }) => entry.bloodRequestId === id
      );

      // Create set of donorIds that have been notified for this request
      const notifiedDonorIds = new Set(
        requestHistory.map((entry: { donorId: string }) => entry.donorId)
      );

      // Set notifyStatus for each donor
      const donorsWithSelection = (data.nearbyDonors || []).map((donor: NearbyDonor) => ({
        ...donor,
        selected: false,
        notifyStatus: notifiedDonorIds.has(donor.id) ? 'Sent' : 'Not Sent',
      }));
        
        setNearbyDonors(donorsWithSelection);
      } catch (err) {
        console.error('Error fetching request details:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user, maxDistance]);

  const handleDistanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMaxDistance(parseInt(e.target.value));
  };

  // Handle donor selection
  const handleDonorSelection = (donorId: string) => {
    setNearbyDonors(prevDonors => 
      prevDonors.map(donor => 
        donor.id === donorId 
          ? { ...donor, selected: !donor.selected } 
          : donor
      )
    );
  };

  // Handle "Select All" functionality
  const handleSelectAll = () => {
    const areAllSelected = nearbyDonors.every(donor => donor.selected);
    
    // Toggle - if all are selected, unselect all, otherwise select all
    setNearbyDonors(prevDonors => 
      prevDonors.map(donor => ({ ...donor, selected: !areAllSelected }))
    );
  };

  const handleSendRequests = async () => {
    const selectedDonors = nearbyDonors.filter(donor => donor.selected);
    
    if (selectedDonors.length === 0) {
      setError('Please select at least one donor to send the request');
      return;
    }
  
    try {
      setIsSending(true);
      setError(null);
  
      const subject = `Urgent Blood Request for ${bloodRequest?.bloodType}`;
      const message = `
  Dear donor,
  
  ${user?.name} urgently needs ${bloodRequest?.quantity} unit(s) of ${bloodRequest?.bloodType} blood.
  
  Urgency Level: ${bloodRequest?.urgency}
  
  Please select your avaiablity through the portal and visit the ${user?.name} donation center to donate.

  Thank you for helping save lives!
  
  Happy donating!

  Best,
  DonorLink Team
  `;
  
      const response = await fetch('/api/sendNotification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donorIds: selectedDonors.map(donor => donor.id),
          subject,
          message,
          clinicId: user?.id,
          bloodRequestId: id,
        }),
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send requests');
      }
  
      setSuccessMessage(`Blood donation requests sent successfully to ${selectedDonors.length} donor(s)`);

      setNearbyDonors(prevDonors => {
        const updatedDonorIds = new Set(selectedDonors.map(d => d.id));
        return prevDonors.map(donor =>
          updatedDonorIds.has(donor.id)
            ? { ...donor, selected: false, notifyStatus: 'Sent' }
            : donor
        );
      });
  
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
  
    } catch (err) {
      console.error('Error sending requests:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while sending requests');
    } finally {
      setIsSending(false);
    }
  };
  

  // Get number of selected donors
  const selectedDonorsCount = nearbyDonors.filter(donor => donor.selected).length;

  // Show loading state while checking auth
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-md p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
          <Link 
            href="/dashboard/clinic" 
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Top Navigation */}
      <nav className="px-6 py-4 flex items-center justify-between bg-white shadow">
        <div className="flex items-center">
          <div className="text-red-600 font-bold text-2xl">DonorLink</div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-800">{user?.name}</span>
          <Link 
            href="/dashboard/clinic"
            className="bg-white hover:bg-gray-50 text-red-600 font-medium py-2 px-6 rounded-full border border-red-200 shadow-sm transition-all duration-300 hover:shadow-md"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          {/* Request Details Header */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                Blood Request Details
              </h2>
              <Link
                href="/dashboard/clinic"
                className="mt-2 sm:mt-0 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Request Summary */}
          {bloodRequest && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Blood Type</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{bloodRequest.bloodType}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{bloodRequest.quantity} units</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Urgency</h3>
                  <p className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bloodRequest.urgency === 'High'
                          ? 'bg-red-100 text-red-800'
                          : bloodRequest.urgency === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {bloodRequest.urgency}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bloodRequest.status === 'Active'
                          ? 'bg-blue-100 text-blue-800'
                          : bloodRequest.status === 'Fulfilled'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {bloodRequest.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nearby Donors Section */}
          <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Nearby Donors ({nearbyDonors.length})
              </h3>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Search radius:</span>
                <select
                  value={maxDistance}
                  onChange={handleDistanceChange}
                  className="border border-gray-300 rounded-md text-sm text-gray-700 px-3 py-1"
                >
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="20">20 km</option>
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
                </select>
              </div>
            </div>

            {nearbyDonors.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-red-600 focus:ring-red-600 border-gray-300 rounded"
                            checked={nearbyDonors.length > 0 && nearbyDonors.every(donor => donor.selected)}
                            onChange={handleSelectAll}
                          />
                          <span className="ml-2">Select All</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Donor Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Blood Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Distance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Donation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notify Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {nearbyDonors.map((donor) => (
                      <tr key={donor.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-red-600 focus:ring-red-600 border-gray-300 rounded"
                            checked={donor.selected || false}
                            onChange={() => handleDonorSelection(donor.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {donor.fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              donor.bloodType === bloodRequest?.bloodType
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {donor.bloodType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {donor.distance.toFixed(1)} km
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{donor.email}</div>
                          <div>{donor.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {donor.lastDonation 
                            ? new Date(donor.lastDonation).toLocaleDateString() 
                            : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            donor.notifyStatus === 'Sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {donor.notifyStatus || 'Not Sent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="mt-4 text-gray-500">No donors found within {maxDistance} km</p>
                <p className="mt-2 text-sm text-gray-400">
                  Try increasing the search radius or check back later for new donors
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={() => router.push('/dashboard/clinic')}
                className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
              
              <div className="flex items-center">
                {selectedDonorsCount > 0 && (
                  <span className="text-sm text-gray-600 mr-3">
                    {selectedDonorsCount} donor{selectedDonorsCount > 1 ? 's' : ''} selected
                  </span>
                )}
                <button
                  onClick={handleSendRequests}
                  disabled={isSending || selectedDonorsCount === 0}
                  className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium ${
                    (isSending || selectedDonorsCount === 0) ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSending ? 'Sending...' : 'Send Request to Selected Donors'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
