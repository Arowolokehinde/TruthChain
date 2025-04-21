import React from 'react';
// import { Link } from 'react-router-dom';

interface Step {
  number: number;
  title: string;
  description: string;
}

const HowItWorksSection: React.FC = () => {
  const steps: Step[] = [
    {
      number: 1,
      title: "Create Content",
      description: "Upload your digital content to our platform."
    },
    {
      number: 2,
      title: "Generate Hash",
      description: "Our system creates a unique SHA-256 fingerprint of your content."
    },
    {
      number: 3,
      title: "Sign & Register",
      description: "Sign with your  wallet and register on the blockchain."
    },
    {
      number: 4,
      title: "Display Badge",
      description: "Add verification badges to your content that anyone can verify."
    }
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">How TruthChain Works</h2>
        
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold text-white">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
              <p className="text-blue-200">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <a 
            href="#technical-details" 
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 rounded-lg font-medium text-white inline-flex items-center"
          >
            View Technical Details
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;