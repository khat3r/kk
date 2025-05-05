'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface BloodRequest {
  id: string;
  clinic: string;
  bloodType: string;
  urgency: 'High' | 'Medium' | 'Low';
  location: string;
  date: string;
  distance: string;
  notificationId: string;
  isInterested?: boolean;
}

interface DonationHistory {
  id: string;
  date: string;
  clinic: string;
  bloodType: string;
  status: string;
}

interface DonorData {
  name: string;
  bloodType: string;
  lastDonation: string | null;
  totalDonations: number;
  eligibleToDonateSince: string;
  points: number;
}

export default function DonorDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donationHistory, setDonationHistory] = useState<DonationHistory[]>([]);
  const [donorData, setDonorData] = useState<DonorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user && !isLoading) {
      setError('Session invalid or expired. Please log in again.');
      return;
    }
    

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
    
        const response = await fetch('/api/donors/dashboard', {
          credentials: 'include',
        });
    
        if (response.status === 401 || response.status === 403) {
          throw new Error('Your session has expired or is invalid. Please log in again.');
        }
        
    
        if (!response.ok) {
          throw new Error('Something went wrong while loading your dashboard.');
        }
    
        const data = await response.json();
        setDonorData(data.donorData);
        setRequests(data.requests);
        setDonationHistory(data.donationHistory);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    

    fetchDashboardData();
  }, [user, router]);

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  const handleExpressInterest = async (notificationId: string) => {
    try {
      const response = await fetch('/api/donors/express-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to express interest');
      }

      // Update the request's interested status
      setRequests(prevRequests => 
        prevRequests.map(request => 
          request.notificationId === notificationId 
            ? { ...request, isInterested: true }
            : request
        )
      );

      setShowThankYou(notificationId);
      setTimeout(() => {
        setShowThankYou(null);
      }, 3000);
    } catch (err) {
      console.error('Error expressing interest:', err);
      setError(err instanceof Error ? err.message : 'Failed to express interest');
    }
  };

  const handleWithdrawInterest = async (notificationId: string) => {
    try {
      const response = await fetch('/api/donors/express-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId, withdraw: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to withdraw interest');
      }

      // Update the request's interested status
      setRequests(prevRequests => 
        prevRequests.map(request => 
          request.notificationId === notificationId 
            ? { ...request, isInterested: false }
            : request
        )
      );
    } catch (err) {
      console.error('Error withdrawing interest:', err);
      setError(err instanceof Error ? err.message : 'Failed to withdraw interest');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-500">Loading ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
        <div className="bg-white shadow-xl rounded-3xl p-8 max-w-md text-center">
          <div className="mx-auto w-16 h-16 flex items-center justify-center bg-red-100 text-red-600 rounded-full">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mt-4">Oops! Something went wrong</h2>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 inline-block bg-red-600 hover:bg-red-800 text-white text-sm px-6 py-2 rounded-full transition duration-200"
          >
            Return to Login
          </button>
          <p className="mt-4 text-xs text-gray-400">Tip: Try logging in with one user per browser or use incognito.</p>
        </div>
      </div>
    );
  }

  if (!donorData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Top Navigation */}
      <nav className="px-6 py-4 flex items-center justify-between bg-white shadow">
        <div className="flex items-center">
          <div className="text-red-600 font-bold text-2xl">DonorLink</div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{donorData.points} points</span>
          </div>
          <span className="text-gray-800">{donorData.name}</span>
          <button 
            onClick={handleSignOut}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showThankYou && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Thanks for your interest. We'll contact you shortly!!</span>
            </div>
            <button 
              onClick={() => setShowThankYou(null)}
              className="text-green-700 hover:text-green-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="col-span-1">
            <div className="bg-white rounded-3xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl">
                    {donorData.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-800">{donorData.name}</h2>
                    <p className="text-red-600 font-medium">
                      Blood Type: {donorData.bloodType}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm uppercase font-medium text-gray-500 mb-2">Your Profile</h3>
                  <div className="space-y-3 text-gray-800">
                    <div className="flex justify-between">
                      <span>Last Donation</span>
                      <span>{donorData.lastDonation ? new Date(donorData.lastDonation).toLocaleDateString() : 'Never'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Donations</span>
                      <span>{donorData.totalDonations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Eligible Since</span>
                      <span>{new Date(donorData.eligibleToDonateSince).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm uppercase font-medium text-gray-500 mb-2">Donation Status</h3>
                  <div className={`p-3 rounded-md ${
                    new Date(donorData.eligibleToDonateSince) <= new Date()
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>
                        {new Date(donorData.eligibleToDonateSince) <= new Date()
                          ? 'You are eligible to donate'
                          : `You will be eligible to donate on ${new Date(donorData.eligibleToDonateSince).toLocaleDateString()}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <button 
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-full shadow-md transition-colors duration-300"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="col-span-1 md:col-span-3">
            <div className="bg-white rounded-3xl shadow-md">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`py-4 px-6 font-medium text-sm ${
                      activeTab === 'requests'
                        ? 'border-b-2 border-red-600 text-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Available Requests
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`py-4 px-6 font-medium text-sm ${
                      activeTab === 'history'
                        ? 'border-b-2 border-red-600 text-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Donation History
                  </button>
                  <button
                    onClick={() => setActiveTab('rewards')}
                    className={`py-4 px-6 font-medium text-sm ${
                      activeTab === 'rewards'
                        ? 'border-b-2 border-red-600 text-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Rewards
                  </button>
                </nav>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeTab === 'requests' && (
                  <div>
                    <div className="flex justify-between mb-6">
                      <h3 className="text-lg font-medium text-gray-800">Active Blood Requests</h3>
                      <div className="flex space-x-3">
                        <select 
                          className="border border-gray-300 rounded-md text-sm text-gray-700 px-3 py-1.5"
                        >
                          <option value="all">All Blood Types</option>
                          <option value="compatible">Compatible with {donorData.bloodType}</option>
                        </select>
                        <button 
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded-md text-sm"
                        >
                          Filter
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {requests.map((request) => (
                        <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-800 font-bold">
                                {request.bloodType}
                              </div>
                              <div>
                                <h4 className="text-base font-medium text-gray-800">{request.clinic}</h4>
                                <p className="text-sm text-gray-500">
                                  {request.location} • {request.distance} km • Required by: {new Date(request.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-4 md:mt-0 flex items-center">
                              <span
                                className={`inline-flex items-center mr-4 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  request.urgency === 'High'
                                    ? 'bg-red-100 text-red-800'
                                    : request.urgency === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {request.urgency}
                              </span>
                              {request.isInterested ? (
                                <button 
                                  className="bg-gray-600 hover:bg-gray-700 text-white py-1.5 px-4 rounded-full text-sm shadow-sm transition-colors duration-300"
                                  onClick={() => handleWithdrawInterest(request.notificationId)}
                                >
                                  Not Interested Anymore
                                </button>
                              ) : (
                                <button 
                                  className="bg-red-600 hover:bg-red-900 text-white py-1.5 px-4 rounded-full text-sm shadow-sm transition-colors duration-300"
                                  disabled={new Date(donorData.eligibleToDonateSince) > new Date()}
                                  onClick={() => handleExpressInterest(request.notificationId)}
                                >
                                  Interested
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {requests.length === 0 && (
                      <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="mt-2 text-gray-500">No blood requests matching your type at this time</p>
                        <p className="text-sm text-gray-400 mt-1">We'll notify you when new requests are available</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div>
                    <h3 className="text-lg font-medium mb-6 text-gray-800">Your Donation History</h3>
                    
                    {donationHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Clinic
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Blood Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Certificate
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {donationHistory.map((donation) => (
                              <tr key={donation.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                  {new Date(donation.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                  {donation.clinic}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                  {donation.bloodType}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {donation.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                  <button className="hover:text-red-700">
                                    Download
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="mt-2 text-gray-500">No donation history yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Your donations will be recorded here once completed
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'rewards' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-800">Your Rewards</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Earn points with each successful donation and redeem for rewards
                      </p>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-red-600 text-white flex items-center justify-center mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">You have <span className="text-red-600 font-bold">{donorData.points} points</span></p>
                          <p className="text-sm text-gray-600">Next donation: +100 points</p>
                        </div>
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-gray-800 mb-4">Available Rewards</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-800">$10 Gift Card</h5>
                            <p className="text-sm text-gray-500 mt-1">Redeem for a $10 gift card at participating stores</p>
                          </div>
                          <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                            200 points
                          </div>
                        </div>
                        <button 
                          className={`mt-4 w-full py-2 rounded-full text-sm ${
                            donorData.points >= 200
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={donorData.points < 200}
                        >
                          {donorData.points >= 200 ? 'Redeem' : 'Not enough points'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}