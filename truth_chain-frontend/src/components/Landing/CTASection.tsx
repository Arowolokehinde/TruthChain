import React from 'react';
import { Link } from 'react-router-dom';

const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-900 to-teal-900 bg-opacity-30">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Create and Protect Your Content?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-blue-100">
          Join the growing community of creators using blockchain technology to secure their digital assets.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link 
            to="/signup" 
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 rounded-lg font-medium text-white"
          >
            Create Account
          </Link>
          <a
            href="#features" 
            className="px-8 py-3 bg-gray-800 bg-opacity-50 border border-white border-opacity-20 rounded-lg font-medium text-blue-100 hover:bg-gray-700 hover:bg-opacity-50 transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTASection;