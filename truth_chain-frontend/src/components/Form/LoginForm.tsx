import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  [key: string]: string | undefined;
}

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loginError, setLoginError] = useState<string>('');
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Clear login error when user modifies the form
    if (loginError) {
      setLoginError('');
    }
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) return;
    
    setIsLoading(true);
    setLoginError('');
    
    // Simulate API call
    try {
      // API login logic would go here
      console.log('Login attempt with:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate authentication error (for demonstration)
      // In a real app, this would be determined by your API response
      const mockResponse = Math.random() > 0.7;
      
      if (mockResponse) {
        throw new Error('Invalid credentials');
      }
      
      // On success, redirect to dashboard
      // navigate('/dashboard');
      console.log('Login successful');
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-gray-700 bg-opacity-10 backdrop-blur-lg rounded-xl shadow-xl border border-white border-opacity-20">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-white">
          Welcome to TruthChain
        </h2>
        <p className="mt-2 text-sm text-blue-200">
          Verify content authenticity with blockchain security
        </p>
      </div>
      
      {loginError && (
        <div className="p-3 text-sm text-white bg-red-500 bg-opacity-80 rounded-lg" role="alert">
          {loginError}
        </div>
      )}
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-1">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`appearance-none relative block w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              placeholder="Email address"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400" id="email-error">
                {errors.email}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className={`appearance-none relative block w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              placeholder="Password"
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400" id="password-error">
                {errors.password}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-blue-100">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-blue-300 hover:text-blue-200 transition-colors">
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white 
            bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
            transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Sign in'}
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 border-opacity-30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-opacity-50 text-blue-200 backdrop-blur-sm">
              Or connect with wallet
            </span>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            type="button"
            className="w-full flex justify-center items-center px-4 py-3 border border-white border-opacity-20 rounded-lg shadow-sm text-sm font-medium text-white bg-transparent hover:bg-gradient-to-r from-blue-600 to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            onClick={() => {
              console.log('Connecting wallet...');
              // Wallet connection logic would go here
            }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Connect Stacks Wallet
          </button>
        </div>
      </div>
      
      <p className="mt-6 text-center text-sm text-blue-200">
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium text-blue-300 hover:text-blue-200 transition-colors">
          Sign up now
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;