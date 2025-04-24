import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ChevronRight, Check, Loader, AlertCircle } from 'lucide-react';


interface FormData {
  name: string;
  email: string;
  role: string;
  interest: string;
}

const WaitList: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: '',
    interest: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formStatus, setFormStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setFormStatus({ type: 'error', message: 'Please enter your name.' });
      return false;
    }
    
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setFormStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return false;
    }
    
    if (!formData.role) {
      setFormStatus({ type: 'error', message: 'Please select your role.' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setFormStatus({ type: null, message: '' });
    
    try {
      // Add to Firebase
      const docRef = await addDoc(collection(db, "waitlist"), {
        ...formData,
        createdAt: serverTimestamp()
      });
      
      // Send email notification via backend endpoint
      const response = await fetch('/api/notify-waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          interest: formData.interest
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
      
      setFormStatus({ 
        type: 'success', 
        message: 'Thank you for joining our waitlist! We\'ll notify you when we launch.' 
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        role: '',
        interest: ''
      });
      
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      setFormStatus({ 
        type: 'error', 
        message: 'Something went wrong. Please try again later.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen  bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8" id="waitlist">
      <div className="max-w-3xl mx-auto mt-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-2 bg-blue-900 bg-opacity-30 rounded-lg mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded p-1">
              <span className="text-xs font-medium uppercase tracking-wide">Join the revolution</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
            Reserve Your Spot
          </h2>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Be among the first to access our decentralized content provenance system
            and take control of your digital creations.
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl border border-gray-700 overflow-hidden shadow-xl">
          <div className="p-6 sm:p-8">
            {formStatus.type === 'success' ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-900 bg-opacity-30 mb-6">
                  <Check className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-xl font-medium mb-2">You're on the list!</h3>
                <p className="text-blue-200 mb-6">{formStatus.message}</p>
                <div className="flex justify-center gap-3">
                  <a 
                    href="#features" 
                    className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-blue-200"
                  >
                    Explore Features
                  </a>
                  <a 
                    href="https://twitter.com/share?text=I just joined the waitlist for a revolutionary decentralized content provenance system! #Web3 #ContentCreators"
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-600 transition-colors"
                  >
                    Share on Twitter
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {formStatus.type === 'error' && (
                  <div className="mb-6 p-4 rounded-lg bg-red-900 bg-opacity-20 border border-red-800 flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-red-300">{formStatus.message}</span>
                  </div>
                )}
                
                <div className="space-y-5">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-blue-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full py-3 px-4 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-blue-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full py-3 px-4 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-blue-300 mb-1">
                      I am a...
                    </label>
                    <select
                      name="role"
                      id="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full py-3 px-4 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select your role</option>
                      <option value="Content Creator">Content Creator</option>
                      <option value="Publisher">Publisher</option>
                      <option value="Platform">Platform Owner</option>
                      <option value="Developer">Developer</option>
                      <option value="Investor">Investor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Interest Field */}
                  <div>
                    <label htmlFor="interest" className="block text-sm font-medium text-blue-300 mb-1">
                      What interests you most about our platform? (Optional)
                    </label>
                    <textarea
                      name="interest"
                      id="interest"
                      rows={3}
                      value={formData.interest}
                      onChange={handleChange}
                      placeholder="Tell us why you're interested in our decentralized content provenance system..."
                      className="w-full py-3 px-4 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium shadow-lg shadow-blue-900/30 flex items-center justify-center transition-all"
                    >
                      {isSubmitting ? (
                        <Loader className="animate-spin h-5 w-5 mr-2" />
                      ) : (
                        <>
                          Join the Waitlist
                          <ChevronRight className="ml-1 h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-400 text-center mt-4">
                    By joining our waitlist, you agree to our 
                    <a href="/terms" className="text-blue-400 hover:text-blue-300 mx-1">Terms</a>
                    and
                    <a href="/privacy" className="text-blue-400 hover:text-blue-300 mx-1">Privacy Policy</a>.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Web3 Indicators */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <div className="flex items-center bg-gray-800 bg-opacity-50 rounded-full px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-green-400 mr-2"></span>
            <span className="text-sm text-gray-300">Blockchain Verified</span>
          </div>
          <div className="flex items-center bg-gray-800 bg-opacity-50 rounded-full px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-blue-400 mr-2"></span>
            <span className="text-sm text-gray-300">Stacks Powered</span>
          </div>
          <div className="flex items-center bg-gray-800 bg-opacity-50 rounded-full px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-purple-400 mr-2"></span>
            <span className="text-sm text-gray-300">Web3 Native</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitList;