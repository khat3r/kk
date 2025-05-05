'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  const handleClinicClick = () => {
    router.push('/clinic_registration');
  };

  const handleDonorClick = () => {
    router.push('/donor_registration');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Navigation Bar */}
      <nav className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-red-600 font-bold text-2xl">DonorLink</div>
          <div className="hidden md:flex ml-10 space-x-8">
            <Link href="#how-it-works" className="text-gray-700 hover:text-red-600 transition-colors">
              How it works
            </Link>
            <Link href="#about" className="text-gray-700 hover:text-red-600 transition-colors">
              About us
            </Link>
            <Link href="#faq" className="text-gray-700 hover:text-red-600 transition-colors">
              FAQ
            </Link>
          </div>
        </div>
        <Link 
          href="/login" 
          className="bg-white hover:bg-gray-50 text-red-600 font-medium py-2 px-6 rounded-full border border-red-200 shadow-sm transition-all duration-300 hover:shadow-md"
        >
          Log In
        </Link>
      </nav>
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-16 pt-12 pb-20">
        <div className="w-full md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Save Lives with <span className="text-red-600">DonorLink</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-lg">
            Connect blood donors with clinics in need. Join our network to help save lives in your community through timely blood donations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleClinicClick}
              className="bg-red-600 hover:bg-red-700 text-white py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              I'm a Clinic
            </button>
            
            <button
              onClick={handleDonorClick}
              className="bg-white hover:bg-gray-50 text-red-600 border-2 border-red-600 py-3 px-8 rounded-full text-lg shadow-md transition-all duration-300 transform hover:-translate-y-1"
            >
              I'm a Donor
            </button>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="relative w-full max-w-md h-80 md:h-96">
            {/* Replace with your actual hero image */}
            <div className="absolute inset-0 bg-red-600 rounded-3xl opacity-10"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="bg-white py-16" id="how-it-works">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">How DonorLink Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-red-50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Register</h3>
              <p className="text-gray-600">Sign up as a clinic or donor with your details and location information.</p>
            </div>
            
            <div className="bg-red-50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Connect</h3>
              <p className="text-gray-600">Clinics request blood types, and we find compatible donors nearby.</p>
            </div>
            
            <div className="bg-red-50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Donate</h3>
              <p className="text-gray-600">Donors respond to requests, save lives, and earn rewards for their contributions.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Statistics Section */}
      <div className="bg-red-600 py-14 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-red-100">Registered Donors</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">250+</div>
              <div className="text-red-100">Partner Clinics</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">12,000+</div>
              <div className="text-red-100">Lives Saved</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* About Section */}
      <div className="bg-white py-16" id="about">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">About DonorLink</h2>
          <p className="text-lg text-gray-600 mb-8">
            DonorLink was founded with a simple mission: to make blood donation efficient, accessible, and rewarding. 
            Our platform uses smart technology to connect donors with the clinics that need them most,
            ensuring that every donation has maximum impact.
          </p>
          
          <div className="flex justify-center">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-full transition-colors duration-300">
              Learn more about our mission
            </button>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="bg-gray-50 py-16" id="faq">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">How often can I donate blood?</h3>
              <p className="text-gray-600">Most healthy adults can donate blood every 56 days. The exact time may vary based on your health condition and local regulations.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">How does the clinic verification process work?</h3>
              <p className="text-gray-600">Clinics are verified through their medical license numbers and additional documentation to ensure the safety and legitimacy of all blood requests.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">What rewards do donors receive?</h3>
              <p className="text-gray-600">Donors earn points for each donation which can be redeemed for various rewards including gift cards, movie tickets, and more.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">DonorLink</h3>
              <p className="text-gray-400">Connecting donors with those in need.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">How it Works</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">info@donorlink.com</li>
                <li className="text-gray-400">+1 (555) 123-4567</li>
              </ul>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>© 2025 DonorLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}