import React from 'react';
import { Shield, Lock, Fingerprint } from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeaturesSection: React.FC = () => {
  const features: Feature[] = [
    {
      icon: <Shield className="w-8 h-8 text-blue-400" />,
      title: "Immutable Proof",
      description: "Register your content with blockchain technology that provides permanent, tamper-proof verification of authenticity and ownership."
    },
    {
      icon: <Lock className="w-8 h-8 text-blue-400" />,
      title: "Blockchain Security",
      description: "Leverage the security of the Stacks blockchain to ensure your content remains verifiable and secure against tampering."
    },
    {
      icon: <Fingerprint className="w-8 h-8 text-blue-400" />,
      title: "Creator Identity",
      description: "Build a verified portfolio of your work, establishing trust with your audience through blockchain verification."
    }
  ];

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">Why Choose TruthChain?</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gray-800 bg-opacity-50 backdrop-blur-md p-8 rounded-xl border border-white border-opacity-10 transition-all duration-300 hover:transform hover:translate-y-[-5px]"
            >
              <div className="bg-blue-900 bg-opacity-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-blue-200">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;