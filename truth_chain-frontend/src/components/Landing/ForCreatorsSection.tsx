import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const ForCreatorsSection: React.FC = () => {
  const benefits: string[] = [
    "Protect your original work with cryptographic proof",
    "Build a verifiable portfolio of your published content",
    "Establish authenticity with your audience",
    "Manage, update, or revoke content as needed"
  ];

  return (
    <section id="for-creators" className="py-20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">For Content Creators</h2>
            <p className="text-lg text-blue-200 mb-6">
              Take control of your digital content and prove your ownership with blockchain technology.
            </p>
            
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <div className="bg-teal-900 bg-opacity-30 rounded-full p-1 mr-4 mt-1">
                    <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className="text-blue-100">{benefit}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-8">
              <Link 
                to="/signup" 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 rounded-lg font-medium text-white inline-flex items-center"
              >
                Start Protecting Your Content
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2 md:pl-12">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md p-6 rounded-xl border border-white border-opacity-10">
              <div className="border-b border-gray-700 pb-4 mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-900 bg-opacity-50 rounded-full mr-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Sarah Johnson</div>
                    <div className="text-sm text-blue-300">Digital Artist</div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="mb-4 h-40 bg-gray-700 bg-opacity-50 rounded-lg flex items-center justify-center text-blue-300">
                  [Digital Art Preview]
                </div>
                <div className="font-semibold text-white">"Ethereal Dawn" - Digital Artwork</div>
                <div className="text-sm text-blue-300">Created: June 12, 2024</div>
              </div>
              
              <div className="bg-teal-900 bg-opacity-30 p-4 rounded-lg flex items-center">
                <Shield className="w-5 h-5 text-teal-400 mr-3" />
                <div>
                  <div className="text-sm font-semibold text-teal-300">Blockchain Verified</div>
                  <div className="text-xs text-teal-400">Hash: 8e3a71c9...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForCreatorsSection;