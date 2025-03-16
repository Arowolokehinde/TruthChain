import React, { FormEvent, ChangeEvent } from 'react';

interface FormData {
  firstName: string;
  lastName: string;
  location: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  walletConnected: boolean;
  walletAddress: string;
  walletType: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  location?: string;
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
  wallet?: string;
  [key: string]: string | undefined;
}

interface AccountDetailsStepProps {
  formData: FormData;
  errors: FormErrors;
  isLoading: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  walletType: string | null;
  walletAddress: string | null;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  togglePasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  goBack: () => void;
}

const AccountDetailsStep: React.FC<AccountDetailsStepProps> = ({
  formData,
  errors,
  isLoading,
  showPassword,
  showConfirmPassword,
  walletType,
  walletAddress,
  handleChange,
  togglePasswordVisibility,
  toggleConfirmPasswordVisibility,
  handleSubmit,
  goBack
}) => {
  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-blue-200 mb-1">First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            value={formData.firstName}
            onChange={handleChange}
            className={`appearance-none relative block w-full px-4 py-3 border ${errors.firstName ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            placeholder="First name"
            aria-invalid={errors.firstName ? 'true' : 'false'}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-400" id="firstName-error">
              {errors.firstName}
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-blue-200 mb-1">Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            value={formData.lastName}
            onChange={handleChange}
            className={`appearance-none relative block w-full px-4 py-3 border ${errors.lastName ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            placeholder="Last name"
            aria-invalid={errors.lastName ? 'true' : 'false'}
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-400" id="lastName-error">
              {errors.lastName}
            </p>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-blue-200 mb-1">Location</label>
        <input
          id="location"
          name="location"
          type="text"
          required
          value={formData.location}
          onChange={handleChange}
          className={`appearance-none relative block w-full px-4 py-3 border ${errors.location ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
          placeholder="City, Country"
          aria-invalid={errors.location ? 'true' : 'false'}
          aria-describedby={errors.location ? 'location-error' : undefined}
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-400" id="location-error">
            {errors.location}
          </p>
        )}
      </div>
      
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
        <label htmlFor="username" className="block text-sm font-medium text-blue-200 mb-1">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          required
          value={formData.username}
          onChange={handleChange}
          className={`appearance-none relative block w-full px-4 py-3 border ${errors.username ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
          placeholder="Choose a username"
          aria-invalid={errors.username ? 'true' : 'false'}
          aria-describedby={errors.username ? 'username-error' : undefined}
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-400" id="username-error">
            {errors.username}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-1">Password</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            className={`appearance-none relative block w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            placeholder="Create a password"
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-400" id="password-error">
            {errors.password}
          </p>
        )}
        <p className="mt-1 text-xs text-blue-200">
          Must be at least 8 characters with uppercase, lowercase, and numbers
        </p>
      </div>
      
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-200 mb-1">Confirm Password</label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`appearance-none relative block w-full px-4 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            placeholder="Confirm your password"
            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
            aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showConfirmPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-400" id="confirm-password-error">
            {errors.confirmPassword}
          </p>
        )}
      </div>
      
      <div className="bg-blue-900 bg-opacity-25 p-3 rounded-lg border border-blue-800">
        <div className="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-teal-300 font-medium">Wallet Connected</span>
          <button
            type="button"
            onClick={goBack}
            className="ml-auto text-xs text-blue-300 hover:text-blue-200"
          >
            Change Wallet
          </button>
        </div>
        <p className="text-blue-200 text-xs">
          {walletType} wallet at address: <span className="text-white font-mono text-xs">{walletAddress?.slice(0, 10)}...{walletAddress?.slice(-4)}</span>
        </p>
      </div>
      
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="agreeToTerms" className="text-blue-200">
            I agree to the <a href="/terms" className="text-blue-300 hover:text-blue-200">Terms of Service</a> and <a href="/privacy" className="text-blue-300 hover:text-blue-200">Privacy Policy</a>
          </label>
          {errors.agreeToTerms && (
            <p className="mt-1 text-sm text-red-400">
              {errors.agreeToTerms}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={goBack}
          className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 border-opacity-30 text-sm font-medium rounded-lg text-blue-200 hover:bg-gray-700 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          Back
        </button>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-2/3 flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white 
          bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
          transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </span>
          ) : 'Create Account'}
        </button>
      </div>
    </form>
  );
};

export default AccountDetailsStep;