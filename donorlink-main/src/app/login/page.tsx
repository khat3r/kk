'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login, loading: authLoading, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'donor', // Default to donor
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Check for saved credentials in localStorage if user previously checked "remember me"
  useEffect(() => {
    const savedCredentials = localStorage.getItem('donorlink_credentials');
    if (savedCredentials) {
      try {
        const { email, userType } = JSON.parse(savedCredentials);
        setFormData(prev => ({ ...prev, email, userType }));
        setRememberMe(true);
      } catch (err) {
        // Ignore parsing errors
        localStorage.removeItem('donorlink_credentials');
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(e.target.checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Save to localStorage if "remember me" is checked
      if (rememberMe) {
        localStorage.setItem('donorlink_credentials', JSON.stringify({
          email: formData.email,
          userType: formData.userType
        }));
      } else {
        localStorage.removeItem('donorlink_credentials');
      }
      
      // Use the AuthContext login function
      await login(formData.email, formData.password, formData.userType as 'donor' | 'clinic');
      
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl shadow-md p-8 max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-800">Log in to DonorLink</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your account
          </p>
        </div>
        
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-800">
                I am a
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-red-600 focus:border-red-600 text-gray-800"
              >
                <option value="donor">Donor</option>
                <option value="clinic">Clinic</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-800">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-600 focus:border-red-600 text-gray-800"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-800">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                required
                className="mt-1 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-600 focus:border-red-600 text-gray-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                className="h-4 w-4 text-red-600 focus:ring-red-600 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-800">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-red-600 hover:text-red-700">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
            >
              {isSubmitting || authLoading ? 'Logging in...' : 'Log in'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <div className="mb-4">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href={formData.userType === 'donor' ? '/donor_registration' : '/clinic_registration'} 
                  className="font-medium text-red-600 hover:text-red-700">
              Register now
            </Link>
          </div>
          
          <Link href="/" className="font-medium text-red-600 hover:text-red-700">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}