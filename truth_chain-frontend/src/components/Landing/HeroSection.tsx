import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="container mx-auto px-6 py-16 md:py-28">
      <div className="flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Decentralized Content Verification on the Blockchain
          </h1>
          <p className="text-lg md:text-xl text-blue-200 mb-8">
            Protect your digital content with immutable proof of ownership and authenticity.
            Built on Stacks blockchain technology.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Link 
              to="/signup" 
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 rounded-lg font-medium text-white flex items-center justify-center"
            >
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <a 
              href="#how-it-works" 
              className="px-8 py-3 border border-blue-400 border-opacity-30 rounded-lg font-medium text-blue-200 hover:bg-blue-900 hover:bg-opacity-20 flex items-center justify-center transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative w-full max-w-md">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-8 border border-white border-opacity-10">
              <div className="flex justify-center mb-6">
                <Shield className="w-16 h-16 text-teal-400" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Content Verification</h3>
                <p className="text-blue-200 mb-4">Instantly verify content authenticity</p>
                <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3 text-sm font-mono text-blue-300">
                  SHA-256: eb721121c6d9e6...
                </div>
                <div className="mt-4 p-2 bg-teal-900 bg-opacity-30 rounded-lg text-teal-300 text-sm">
                  ✓ Verified on Stacks Blockchain
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-blue-500 opacity-20 blur-xl rounded-xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;