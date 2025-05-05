// src/app/request_blood/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RequestBloodPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    bloodType: 'A+',
    quantity: 1,
    urgency: 'Medium',
    notes: '',
  });

  // Redirect if not logged in or not a clinic
  useEffect(() => {
    if (!loading && (!user || user.userType !== 'clinic')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user || user.userType !== 'clinic') {
      setError('You must be logged in as a clinic to request blood');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await fetch('/api/clinics/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include', // Important to include cookies for authentication
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit blood request');
      }
      
      // Extract the request ID from the response
      if (data.request && data.request._id) {
        // Redirect to the details page for this specific request
        router.push(`/request_details/${data.request._id}`);
      } else if (data.request && data.request.id) {
        // Some APIs might return 'id' instead of '_id'
        router.push(`/request_details/${data.request.id}`);
      } else {
        // Fallback if ID isn't available in the expected format
        console.error('Could not find request ID in response:', data);
        router.push('/dashboard/clinic');
      }
    } catch (err) {
      console.error('Error submitting blood request:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking auth
  if (loading) {
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

  // Render the form only if user is a clinic
  if (!user || user.userType !== 'clinic') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Top Navigation */}
      <nav className="px-6 py-4 flex items-center justify-between bg-white shadow">
        <div className="flex items-center">
          <div className="text-red-600 font-bold text-2xl">DonorLink</div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-800">{user.name}</span>
          <Link 
            href="/dashboard/clinic"
            className="bg-white hover:bg-gray-50 text-red-600 font-medium py-2 px-6 rounded-full border border-red-200 shadow-sm transition-all duration-300 hover:shadow-md"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-md p-8">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-800">Request Blood</h2>
            <p className="mt-1 text-gray-600">
              Fill in the details to request blood donations from available donors.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-6 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">
                Blood Type
              </label>
              <select
                id="bloodType"
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md text-gray-800"
                required
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantity (units)
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-gray-800"
                required
              />
            </div>

            <div>
              <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">
                Urgency Level
              </label>
              <select
                id="urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md text-gray-800"
                required
              >
                <option value="High">High (Needed within 24 hours)</option>
                <option value="Medium">Medium (Needed within 3 days)</option>
                <option value="Low">Low (Needed within a week)</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-gray-800"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <Link
                href="/dashboard/clinic"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-8 rounded-full shadow-md transition-colors duration-300 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}