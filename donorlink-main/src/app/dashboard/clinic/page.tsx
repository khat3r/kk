'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Define types for the blood request
interface BloodRequest {
  _id: string;
  bloodType: string;
  quantity: number;
  urgency: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Fulfilled' | 'Cancelled' | 'Expired';
  createdAt: string;
  clinicId?: string;
  clinicName?: string;
  clinicEmail?: string;
  notes?: string;
}

interface DonorRequest {
  id: string;
  bloodRequestId: string;
  bloodType: string;
  urgency: 'High' | 'Medium' | 'Low';
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  donorBloodType: string;
  status: 'sent' | 'failed' | 'donated' | 'interested';
  createdAt: Date;
}

export default function ClinicDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donorRequests, setDonorRequests] = useState<DonorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [markedDonations, setMarkedDonations] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch blood requests for this clinic
    const fetchBloodRequests = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/clinics/requests');
        
        if (!response.ok) {
          throw new Error('Failed to fetch blood requests');
        }
        
        const data = await response.json();
        setRequests(data.requests || []);
      } catch (err) {
        console.error('Error fetching blood requests:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch donor requests data
    const fetchDonorRequests = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/clinics/donors', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch donor requests data');
        }
        
        const data = await response.json();
        setDonorRequests(data.donorRequests);
      } catch (err) {
        console.error('Error fetching donor requests data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBloodRequests();
    fetchDonorRequests();
  }, [user, router]);

  const handleRequestBlood = () => {
    router.push('/request_blood');
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/clinics/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Cancelled' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel request');
      }

      // Update UI after successful cancellation
      setRequests(requests.map(req => 
        req._id === requestId ? { ...req, status: 'Cancelled' } : req
      ));
    } catch (err) {
      console.error('Error cancelling request:', err);
      alert('Failed to cancel request. Please try again.');
    }
  };

  const handleMarkDonated = async (requestId: string) => {
    try {
      // Add to marked donations set immediately to disable button
      setMarkedDonations(prev => new Set([...prev, requestId]));

      const response = await fetch(`/api/clinics/donors/${requestId}/mark-donated`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If request fails, remove from marked donations set
        setMarkedDonations(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
        throw new Error('Failed to mark as donated');
      }

      // Update the local state to reflect the change
      setDonorRequests(donorRequests.map(req => 
        req.id === requestId ? { ...req, status: 'donated' } : req
      ));

      // Show success message
      setSuccessMessage('Successfully marked as donated and awarded 100 points to the donor');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Error marking as donated:', err);
      setError('Failed to mark as donated. Please try again.');
    }
  };

  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(req => req.status.toLowerCase() === statusFilter);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Top Navigation */}
      <nav className="px-6 py-4 flex items-center justify-between bg-white shadow">
        <div className="flex items-center">
          <div className="text-red-600 font-bold text-2xl">DonorLink</div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-800">{user?.name || 'Clinic'}</span>
          <button 
            onClick={handleSignOut}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Success Message Banner */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 00-1.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-md">
          {/* Dashboard Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Clinic Dashboard</h2>
            <button
              onClick={handleRequestBlood}
              className="bg-red-600 hover:bg-red-900 text-white py-2 px-6 rounded-full shadow-md transition-colors duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Request Blood
            </button>
          </div>

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
                Blood Requests
              </button>
              <button
                onClick={() => setActiveTab('donors')}
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'donors'
                    ? 'border-b-2 border-red-600 text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Requested Donors
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
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'requests' && (
              <div>
                <div className="flex justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-800">Blood Requests</h3>
                  <div className="flex space-x-3">
                    <select 
                      className="border border-gray-300 rounded-md text-sm text-gray-700 px-3 py-1.5"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-10">
                    <svg className="animate-spin h-8 w-8 mx-auto text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 text-gray-500">Loading blood requests...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">
                          {error}. Please refresh the page or try again later.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : filteredRequests.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Blood Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Urgency
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRequests.map((request) => (
                          <tr key={request._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              #{request._id.substring(0, 6)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              {request.bloodType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              {request.quantity} units
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  request.urgency === 'High'
                                    ? 'bg-red-100 text-red-800'
                                    : request.urgency === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {request.urgency}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  request.status === 'Active'
                                    ? 'bg-blue-100 text-blue-800'
                                    : request.status === 'Fulfilled'
                                    ? 'bg-green-100 text-green-800'
                                    : request.status === 'Cancelled'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {request.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              <button 
                                className="text-red-600 hover:text-red-700 mr-3"
                                onClick={() => router.push(`/request_details/${request._id}`)}
                              >
                                View
                              </button>
                              {request.status === 'Active' && (
                                <button 
                                  className="text-gray-600 hover:text-gray-900"
                                  onClick={() => handleCancelRequest(request._id)}
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No blood requests found</p>
                    <button
                      onClick={handleRequestBlood}
                      className="mt-4 bg-red-600 hover:bg-red-900 text-white py-2 px-4 rounded-full text-sm inline-flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create Request
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'donors' && (
              <div>
                <div className="flex justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-800">Requested Donors</h3>
                  <div className="flex space-x-3">
                    <select 
                      className="border border-gray-300 rounded-md text-sm text-gray-700 px-3 py-1.5"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="sent">Sent</option>
                      <option value="failed">Failed</option>
                    </select>
                    <button 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded-md text-sm"
                    >
                      Filter
                    </button>
                  </div>
                </div>
                
                {donorRequests.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Request ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Donor Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Donor Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Blood Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Request Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {donorRequests.map((request) => (
                          <tr key={request.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              #{request.bloodRequestId.substring(0, 6)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{request.donorName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{request.donorEmail}</div>
                              <div className="text-sm text-gray-500">{request.donorPhone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{request.donorBloodType}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                request.status === 'sent'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : request.status === 'interested'
                                  ? 'bg-green-100 text-green-800'
                                  : request.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                className={`py-1 px-3 rounded-md text-sm ${
                                  request.status === 'donated' || markedDonations.has(request.id)
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : request.status === 'sent' || request.status === 'failed'
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-900 text-white'
                                }`}
                                onClick={() => handleMarkDonated(request.id)}
                                disabled={request.status === 'donated' || markedDonations.has(request.id) || request.status === 'sent' || request.status === 'failed'}
                              >
                                {request.status === 'donated' || markedDonations.has(request.id)
                                  ? 'Marked Donated'
                                  : request.status === 'sent' || request.status === 'failed'
                                  ? 'Mark Donated'
                                  : 'Mark Donated'}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="mt-2 text-gray-500">No donor requests yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Donor requests will appear here when you send blood requests
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-medium mb-6 text-gray-800">Donation History</h3>
                
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <p className="mt-2 text-gray-500">No donation history available</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Donation history will appear once donors respond to your requests
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}