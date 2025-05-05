'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Quiz question type
type QuizQuestion = {
  id: number;
  question: string;
  options: { value: string; label: string }[];
  required: boolean;
};

// Registration form type
type DonorFormData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  bloodType: string;
  latitude: string;
  longitude: string;
  address: string;
};

// Quiz answers type
type QuizAnswers = {
  [key: number]: string;
};

export default function DonorRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState<'quiz' | 'registration' | 'success'>('quiz');
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
  const [quizError, setQuizError] = useState<string | null>(null);
  const [formData, setFormData] = useState<DonorFormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bloodType: '',
    latitude: '',
    longitude: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<DonorFormData & { form?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Eligibility quiz questions
  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: 'What is your age?',
      options: [
        { value: 'under17', label: 'Under 17' },
        { value: '17to65', label: '17 to 65' },
        { value: 'over65', label: 'Over 65' },
      ],
      required: true,
    },
    {
      id: 2,
      question: 'What is your weight?',
      options: [
        { value: 'under50kg', label: 'Under 50kg' },
        { value: '50to60kg', label: '50kg to 60kg' },
        { value: 'over60kg', label: 'Over 60kg' },
      ],
      required: true,
    },
    {
      id: 3,
      question: 'When was your last blood donation?',
      options: [
        { value: 'never', label: 'Never donated before' },
        { value: 'within3months', label: 'Within last 3 months' },
        { value: '3to6months', label: '3 to 6 months ago' },
        { value: 'over6months', label: 'Over 6 months ago' },
      ],
      required: true,
    },
    {
      id: 4,
      question: 'Do you have any chronic medical conditions?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      required: true,
    },
    {
      id: 5,
      question: 'Are you currently taking any medications?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      required: true,
    },
    {
      id: 6,
      question: 'Have you had any recent surgeries within the past 6 months?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      required: true,
    },
    {
      id: 7,
      question: 'What is your blood type (if known)?',
      options: [
        { value: 'unknown', label: 'Unknown' },
        { value: 'apositive', label: 'A+' },
        { value: 'anegative', label: 'A-' },
        { value: 'bpositive', label: 'B+' },
        { value: 'bnegative', label: 'B-' },
        { value: 'abpositive', label: 'AB+' },
        { value: 'abnegative', label: 'AB-' },
        { value: 'opositive', label: 'O+' },
        { value: 'onegative', label: 'O-' },
      ],
      required: false,
    },
  ];

  // Handle quiz answer changes
  const handleQuizAnswerChange = (questionId: number, answer: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Submit quiz and check eligibility
  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if all required questions are answered
    const unansweredRequired = questions
      .filter(q => q.required)
      .filter(q => !quizAnswers[q.id])
      .map(q => q.id);
    
    if (unansweredRequired.length > 0) {
      setQuizError('You should complete all the required questions to proceed.');
      return;
    }
    
    // Determine eligibility based on answers
    // For this implementation, we're using basic rules:
    // - Must be 17-65 years old
    // - Must weigh over 50kg
    // - Last donation must be > 3 months ago
    // - No chronic conditions
    const eligible = (
      quizAnswers[1] === '17to65' && 
      (quizAnswers[2] === '50to60kg' || quizAnswers[2] === 'over60kg') &&
      (quizAnswers[3] === 'never' || quizAnswers[3] === '3to6months' || quizAnswers[3] === 'over6months') &&
      quizAnswers[4] === 'no'
    );
    
    setIsEligible(eligible);
    
    if (eligible) {
      // If known blood type, pre-fill in registration
      if (quizAnswers[7] && quizAnswers[7] !== 'unknown') {
        const bloodTypeMap: { [key: string]: string } = {
          'apositive': 'A+',
          'anegative': 'A-',
          'bpositive': 'B+',
          'bnegative': 'B-',
          'abpositive': 'AB+',
          'abnegative': 'AB-',
          'opositive': 'O+',
          'onegative': 'O-',
        };
        
        setFormData(prev => ({
          ...prev,
          bloodType: bloodTypeMap[quizAnswers[7]],
        }));
      }
      
      setStep('registration');
    }
  };

  // Handle form field changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Get current location from browser
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
          setFormErrors(prev => ({
            ...prev,
            form: 'Unable to get your current location. Please enter coordinates manually.'
          }));
          console.error('Error getting location:', error);
        }
      );
    } else {
      setFormErrors(prev => ({
        ...prev,
        form: 'Geolocation is not supported by your browser. Please enter coordinates manually.'
      }));
    }
  };

  // Validate the registration form
  const validateForm = (): boolean => {
    const errors: Partial<DonorFormData> = {};
    
    // Check required fields
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.password) errors.password = 'Password is required';
    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    if (!formData.bloodType) errors.bloodType = 'Blood type is required';
    if (!formData.latitude) errors.latitude = 'Latitude is required';
    if (!formData.longitude) errors.longitude = 'Longitude is required';
    if (!formData.address) errors.address = 'Address is required';
    
    // Email validation
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone validation
    if (formData.phone && !/^\+?[0-9\s]{8,}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    // Latitude validation (between -90 and 90)
    if (formData.latitude) {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.latitude = 'Latitude must be a number between -90 and 90';
      }
    }
    
    // Longitude validation (between -180 and 180)
    if (formData.longitude) {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.longitude = 'Longitude must be a number between -180 and 180';
      }
    }
    
    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Password strength
    if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle registration form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Map quiz answers to the format expected by the model
      const eligibilityQuiz = {
        age: quizAnswers[1] || '',
        weight: quizAnswers[2] || '',
        lastDonation: quizAnswers[3] || '',
        medicalConditions: quizAnswers[4] || '',
        medications: quizAnswers[5] || '',
        recentSurgery: quizAnswers[6] || ''
      };
      
      const response = await fetch('/api/donors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phone, // Changed to match expected model field
          bloodType: formData.bloodType,
          location: {
            coordinates: [
              parseFloat(formData.longitude), // Note longitude first!
              parseFloat(formData.latitude)
            ]
          },
          address: formData.address,
          password: formData.password,
          // Add the eligibility quiz data
          eligibilityQuiz: eligibilityQuiz,
          // Also add longitude and latitude directly since they're required
          longitude: parseFloat(formData.longitude),
          latitude: parseFloat(formData.latitude),
          phone: formData.phone // Add phone directly as it's required
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Success case
      setStep('success');
      
    } catch (error: any) {
      setFormErrors({
        form: error.message || 'An error occurred during registration. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render quiz step
  if (step === 'quiz') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-md p-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Donor Eligibility Quiz</h1>
            
            {isEligible === false && (
              <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md text-center">
                <p className="font-medium">You are not eligible to donate due to your age requirement.</p>
                <p className="mt-2">Thank you for your interest in donating blood.</p>
                <Link href="/" className="mt-4 inline-block text-red-600 hover:text-red-700 underline">
                  Return to Home
                </Link>
              </div>
            )}
            
            {quizError && (
              <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md">
                {quizError}
              </div>
            )}
            
            <form onSubmit={handleQuizSubmit} className="space-y-6">
              {questions.map((q) => (
                <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium mb-3 text-gray-800">
                    {q.question} {q.required && <span className="text-red-500">*</span>}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((option) => (
                      <label key={option.value} className="flex items-center space-x-2 text-gray-800">
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={option.value}
                          checked={quizAnswers[q.id] === option.value}
                          onChange={() => handleQuizAnswerChange(q.id, option.value)}
                          className="h-4 w-4 text-red-600 focus:ring-red-600 border-gray-300"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between">
                <Link
                  href="/"
                  className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-800"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-full transition-colors duration-300"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render registration form step
  if (step === 'registration') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-8">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-md p-8">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Donor Registration</h1>
            
            {formErrors.form && (
              <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md">
                {formErrors.form}
              </div>
            )}
            
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-1 text-gray-800">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                />
                {formErrors.fullName && <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>}
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
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                />
                {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
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
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                />
                {formErrors.phone && <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>}
              </div>
              
              <div>
                <label htmlFor="bloodType" className="block text-sm font-medium mb-1 text-gray-800">
                  Blood Type
                </label>
                <select
                  id="bloodType"
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                {formErrors.bloodType && <p className="mt-1 text-sm text-red-600">{formErrors.bloodType}</p>}
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-1 text-gray-800">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                />
                {formErrors.address && <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>}
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-800">Location Coordinates</h3>
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
                      onChange={handleFormChange}
                      className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                      placeholder="e.g., 24.4667"
                    />
                    {formErrors.latitude && <p className="mt-1 text-sm text-red-600">{formErrors.latitude}</p>}
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
                      onChange={handleFormChange}
                      className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                      placeholder="e.g., 54.3667"
                    />
                    {formErrors.longitude && <p className="mt-1 text-sm text-red-600">{formErrors.longitude}</p>}
                  </div>
                </div>
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
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                />
                {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
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
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800"
                />
                {formErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>}
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep('quiz')}
                  className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-800"
                >
                  Back to Quiz
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-full transition-colors duration-300"
                >
                  {isSubmitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render success step
  if (step === 'success') {
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
            Congratulations! Your donor profile has been created. You are now part of the DonorLink community.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            You will be notified when your blood type is needed in your area.
          </p>
          <Link 
            href="/dashboard/donor" 
            className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-full transition-colors duration-300 inline-block"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // This should never happen, but TypeScript needs a default return
  return null;
}