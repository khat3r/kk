'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type FormData = {
  name: string;
  latitude: string;
  longitude: string;
  email: string;
  phone: string;
  licenseNumber: string;
  password: string;
  confirmPassword: string;
  address: string;
};

type FormErrors = {
  [key in keyof FormData]?: string;
} & {
  form?: string;
};

export default function ClinicRegistrationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    latitude: '',
    longitude: '',
    email: '',
    phone: '',
    licenseNumber: '',
    password: '',
    confirmPassword: '',
    address: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Check for empty fields
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) {
        newErrors[key as keyof FormData] = 'All fields must be filled to complete registration.';
      }
    });
    
    // Email validation
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    
    // Phone validation - simple pattern for illustration
    if (formData.phone && !/^\+?[0-9\s]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number.';
    }
    
    // Latitude validation (between -90 and 90)
    if (formData.latitude) {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be a number between -90 and 90.';
      }
    }
    
    // Longitude validation (between -180 and 180)
    if (formData.longitude) {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitude must be a number between -180 and 180.';
      }
    }
    
    // Password matching
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    
    // Password strength
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/clinics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          latitude: formData.latitude,
          longitude: formData.longitude,
          email: formData.email,
          phone: formData.phone,
          licenseNumber: formData.licenseNumber,
          password: formData.password,
          address: formData.address,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Success case
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (error: any) {
      setErrors({
        form: error.message || 'An error occurred during registration. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          setErrors(prev => ({
            ...prev,
            form: 'Unable to get your current location. Please enter coordinates manually.'
          }));
          console.error('Error getting location:', error);
        }
      );
    } else {
      setErrors(prev => ({
        ...prev,
        form: 'Geolocation is not supported by your browser. Please enter coordinates manually.'
      }));
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-md p-8 max-w-xl w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">Registration Successful!</h2>
          <p className="mb-6 text-gray-800">
            Congratulations! {formData.name} is successfully registered to DonorLink.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-8">
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-md p-8">
          <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Clinic Registration</h1>
          
          {errors.form && (
            <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md">
              {errors.form}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-800">
                Clinic Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1 text-gray-800">
                Clinic Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
              />
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-800">Location Coordinates of the Clinic</h3>
                <button 
                  type="button" 
                  onClick={getCurrentLocation}
                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
                >
                  Use Current Location
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium mb-1 text-gray-800">
                    Latitude
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="text"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                    placeholder="e.g., 24.4667"
                  />
                  {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>}
                </div>
                
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium mb-1 text-gray-800">
                    Longitude
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="text"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                    placeholder="e.g., 54.3667"
                  />
                  {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>}
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-800">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1 text-gray-800">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                placeholder="+9715********"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
            
            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-medium mb-1 text-gray-800">
                License Number
              </label>
              <input
                id="licenseNumber"
                name="licenseNumber"
                type="text"
                value={formData.licenseNumber}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
              />
              {errors.licenseNumber && <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-800">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-gray-800">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-full transition-colors duration-300 font-medium"
              >
                {isSubmitting ? 'Registering...' : 'Register Clinic'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <Link href="/" className="text-red-600 hover:text-red-700 text-sm underline">
                Back to Home
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}