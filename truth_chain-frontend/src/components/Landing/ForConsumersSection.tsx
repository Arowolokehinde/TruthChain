import React from 'react';

const ForConsumersSection: React.FC = () => {
  const benefits: string[] = [
    "Verify content hasn't been altered since publication",
    "Confirm the original creator's identity",
    "See when content was first registered",
    "Browse a creator's verified content portfolio"
  ];

  return (
    <section id="for-consumers" className="py-20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row-reverse items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pl-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">For Content Consumers</h2>
            <p className="text-lg text-blue-200 mb-6">
              Ensure the content you engage with is authentic, unaltered, and from the original creator.
            </p>
            
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <div className="bg-blue-900 bg-opacity-30 rounded-full p-1 mr-4 mt-1">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className="text-blue-100">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="md:w-1/2">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md p-6 rounded-xl border border-white border-opacity-10">
              <div className="mb-4">
                <div className="font-bold text-lg text-white mb-2">Article Verification</div>
                <div className="h-8 bg-gray-700 bg-opacity-50 rounded mb-2"></div>
                <div className="h-8 bg-gray-700 bg-opacity-50 rounded mb-2"></div>
                <div className="h-8 bg-gray-700 bg-opacity-50 rounded w-2/3"></div>
              </div>
              
              <div className="border-t border-b border-gray-700 py-4 my-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-blue-200">Content Status:</div>
                  <div className="bg-teal-900 bg-opacity-30 text-teal-300 px-2 py-1 rounded text-sm font-medium">Verified</div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-blue-200">Creator:</div>
                  <div className="text-blue-300">SP2JXZAK..48CF</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-blue-200">Published:</div>
                  <div className="text-blue-100">May 15, 2024 11:23 AM</div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button className="px-4 py-2 bg-blue-900 bg-opacity-50 text-blue-200 rounded-lg hover:bg-blue-800 transition-colors text-sm border border-blue-700 border-opacity-50">
                  View Blockchain Record
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForConsumersSection;