// import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import useWallet from '../../hooks/useWallet';

// interface FormData {
//   firstName: string;
//   lastName: string;
//   location: string;
//   email: string;
//   username: string;
//   password: string;
//   confirmPassword: string;
//   agreeToTerms: boolean;
//   walletConnected: boolean;
//   walletAddress: string;
//   walletType: string;
// }

// interface FormErrors {
//   firstName?: string;
//   lastName?: string;
//   location?: string;
//   email?: string;
//   username?: string;
//   password?: string;
//   confirmPassword?: string;
//   agreeToTerms?: string;
//   wallet?: string;
//   [key: string]: string | undefined;
// }

// interface UserData {
//   firstName: string;
//   lastName: string;
//   username: string;
//   location: string;
//   email: string;
//   walletConnected: boolean;
//   walletAddress: string;
//   walletType: string;
//   joinDate: string;
//   verified: boolean;
// }

// const SignupForm: React.FC = () => {
//   const navigate = useNavigate();
//   // Correctly use the hook at the top level of your component
//   const { walletConnected, walletAddress, walletType, connectWallet } = useWallet();
  
//   const [formData, setFormData] = useState<FormData>({
//     firstName: '',
//     lastName: '',
//     location: '',
//     email: '',
//     username: '',
//     password: '',
//     confirmPassword: '',
//     agreeToTerms: false,
//     walletConnected: false,
//     walletAddress: '',
//     walletType: ''
//   });
  
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [errors, setErrors] = useState<FormErrors>({});
//   const [signupError, setSignupError] = useState<string>('');
//   const [showPassword, setShowPassword] = useState<boolean>(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
//   const [formStep, setFormStep] = useState<number>(1); // 1: Wallet connection, 2: User details
  
//   // Update form data when wallet state changes
//   useEffect(() => {
//     setFormData(prev => ({
//       ...prev,
//       walletConnected,
//       walletAddress: walletAddress || '',
//       walletType: walletType || ''
//     }));
//   }, [walletConnected, walletAddress, walletType]);
  
//   const validateWalletStep = (): boolean => {
//     if (!formData.walletConnected) {
//       setSignupError('You must connect your wallet to continue');
//       return false;
//     }
//     return true;
//   };
  
//   const validateForm = (): boolean => {
//     const newErrors: FormErrors = {};
    
//     // First name validation
//     if (!formData.firstName) {
//       newErrors.firstName = 'First name is required';
//     }
    
//     // Last name validation
//     if (!formData.lastName) {
//       newErrors.lastName = 'Last name is required';
//     }
    
//     // Location validation
//     if (!formData.location) {
//       newErrors.location = 'Location is required';
//     }
    
//     // Email validation
//     if (!formData.email) {
//       newErrors.email = 'Email is required';
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = 'Email is invalid';
//     }
    
//     // Username validation
//     if (!formData.username) {
//       newErrors.username = 'Username is required';
//     } else if (formData.username.length < 3) {
//       newErrors.username = 'Username must be at least 3 characters';
//     } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
//       newErrors.username = 'Username can only contain letters, numbers, and underscores';
//     }
    
//     // Password validation
//     if (!formData.password) {
//       newErrors.password = 'Password is required';
//     } else if (formData.password.length < 8) {
//       newErrors.password = 'Password must be at least 8 characters';
//     } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
//       newErrors.password = 'Password must include uppercase, lowercase, and numbers';
//     }
    
//     // Confirm password
//     if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = 'Passwords do not match';
//     }
    
//     // Terms agreement
//     if (!formData.agreeToTerms) {
//       newErrors.agreeToTerms = 'You must agree to the terms and conditions';
//     }
    
//     // Wallet validation - should already be connected due to our two-step flow
//     if (!formData.walletConnected) {
//       newErrors.wallet = 'Wallet connection is required';
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };
  
//   const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
    
//     // Clear error when user types
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: undefined }));
//     }
    
//     // Clear signup error when user modifies the form
//     if (signupError) {
//       setSignupError('');
//     }
//   };
  
//   const togglePasswordVisibility = (): void => {
//     setShowPassword(!showPassword);
//   };
  
//   const toggleConfirmPasswordVisibility = (): void => {
//     setShowConfirmPassword(!showConfirmPassword);
//   };
  
//   const handleContinue = (): void => {
//     if (validateWalletStep()) {
//       setFormStep(2);
//     }
//   };
  
//   const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
//     e.preventDefault();
    
//     // Validate form before submission
//     if (!validateForm()) return;
    
//     setIsLoading(true);
//     setSignupError('');
    
//     // Simulate API call
//     try {
//       // API signup logic would go here
//       console.log('Signup attempt with:', formData);
      
//       await new Promise(resolve => setTimeout(resolve, 1500));
      
//       // Simulate username taken error (for demonstration)
//       if (formData.username === 'admin' || formData.username === 'test') {
//         throw new Error('Username already taken');
//       }
      
//       // Store user data in localStorage for the dashboard to access
//       const userData: UserData = {
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         username: formData.username,
//         location: formData.location,
//         email: formData.email,
//         walletConnected: formData.walletConnected,
//         walletAddress: formData.walletAddress,
//         walletType: formData.walletType,
//         joinDate: new Date().toISOString(),
//         verified: true
//       };
      
//       localStorage.setItem('userData', JSON.stringify(userData));
      
//       // Redirect to dashboard on successful registration
//       navigate('/dashboard');
      
//       console.log('Signup successful');
//     } catch (error) {
//       console.error('Signup failed:', error);
//       setSignupError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   // Handle wallet connection with specific wallet type
//   const handleConnectWallet = (walletType: string) => {
//     connectWallet();
//     // Set wallet type in form data
//     setFormData(prev => ({
//       ...prev,
//       walletType
//     }));
//   };
  
//   return (
//     <div className="w-full max-w-md p-8 space-y-6 bg-gray-700 bg-opacity-10 backdrop-blur-lg rounded-xl shadow-xl border-2 border-white border-opacity-30">
//       <div className="text-center">
//         <h2 className="mt-2 text-3xl font-extrabold text-white">
//           Join TruthChain
//         </h2>
//         <p className="mt-2 text-sm text-blue-200">
//           Create your account to verify content with blockchain security
//         </p>
//       </div>
      
//       {signupError && (
//         <div className="p-3 text-sm text-white bg-red-500 bg-opacity-80 rounded-lg" role="alert">
//           {signupError}
//         </div>
//       )}
      
//       {/* Step indicator */}
//       <div className="flex items-center justify-center">
//         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
//           formStep === 1 ? 'bg-blue-600 text-white' : 'bg-teal-600 text-white'
//         }`}>
//           1
//         </div>
//         <div className={`h-1 w-8 ${formStep === 1 ? 'bg-gray-600' : 'bg-teal-600'}`}></div>
//         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
//           formStep === 1 ? 'bg-gray-600 text-gray-300' : 'bg-blue-600 text-white'
//         }`}>
//           2
//         </div>
//       </div>
      
//       {/* Step labels */}
//       <div className="flex items-center justify-center text-xs text-gray-300 -mt-4">
//         <div className={`text-center w-24 ${formStep === 1 ? 'text-blue-300' : 'text-teal-300'}`}>
//           Connect Wallet
//         </div>
//         <div className={`text-center w-24 ${formStep === 1 ? 'text-gray-400' : 'text-blue-300'}`}>
//           Account Details
//         </div>
//       </div>
      
//       {/* Step 1: Wallet Connection */}
//       {formStep === 1 && (
//         <div className="space-y-6">
//           <div className="text-center mb-2">
//             <p className="text-white font-medium mb-1">Step 1: Connect Your Wallet</p>
//             <p className="text-sm text-blue-200">
//               Please connect your Stacks wallet to continue with registration
//             </p>
//           </div>
          
//           <div className="relative">
//             {/* Fixed wallet connect buttons */}
//             <div className="flex flex-col space-y-3">
//               <button 
//                 onClick={() => handleConnectWallet('Stacks')}
//                 className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//               >
//                 Connect Stacks Wallet
//               </button>
//               <button 
//                 onClick={() => handleConnectWallet('Metamask')}
//                 className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
//               >
//                 Connect with Metamask
//               </button>
//             </div>
//           </div>
          
//           {walletConnected && (
//             <div className="bg-blue-900 bg-opacity-25 p-4 rounded-lg border border-blue-800">
//               <div className="flex items-center">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                 </svg>
//                 <span className="text-teal-300 font-medium">Wallet Successfully Connected</span>
//               </div>
//               <p className="text-blue-200 text-sm mt-2">
//                 Wallet Type: <span className="text-white">{walletType}</span>
//               </p>
//               <p className="text-blue-200 text-sm">
//                 Address: <span className="text-white font-mono text-xs">{walletAddress}</span>
//               </p>
//             </div>
//           )}
          
//           <button
//             type="button"
//             onClick={handleContinue}
//             disabled={!walletConnected}
//             className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white 
//             bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
//             transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
//           >
//             Continue to Account Setup
//           </button>
          
//           <p className="text-center text-sm text-blue-200">
//             Already have an account?{' '}
//             <Link to="/login" className="font-medium text-blue-300 hover:text-blue-200 transition-colors">
//               Sign in
//             </Link>
//           </p>
//         </div>
//       )}
      
//       {/* Step 2: Account Details */}
//       {formStep === 2 && (
//         <form className="space-y-5" onSubmit={handleSubmit} noValidate>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label htmlFor="firstName" className="block text-sm font-medium text-blue-200 mb-1">First Name</label>
//               <input
//                 id="firstName"
//                 name="firstName"
//                 type="text"
//                 required
//                 value={formData.firstName}
//                 onChange={handleChange}
//                 className={`appearance-none relative block w-full px-4 py-3 border ${errors.firstName ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
//                 placeholder="First name"
//                 aria-invalid={errors.firstName ? 'true' : 'false'}
//                 aria-describedby={errors.firstName ? 'firstName-error' : undefined}
//               />
//               {errors.firstName && (
//                 <p className="mt-1 text-sm text-red-400" id="firstName-error">
//                   {errors.firstName}
//                 </p>
//               )}
//             </div>
            
//             <div>
//               <label htmlFor="lastName" className="block text-sm font-medium text-blue-200 mb-1">Last Name</label>
//               <input
//                 id="lastName"
//                 name="lastName"
//                 type="text"
//                 required
//                 value={formData.lastName}
//                 onChange={handleChange}
//                 className={`appearance-none relative block w-full px-4 py-3 border ${errors.lastName ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
//                 placeholder="Last name"
//                 aria-invalid={errors.lastName ? 'true' : 'false'}
//                 aria-describedby={errors.lastName ? 'lastName-error' : undefined}
//               />
//               {errors.lastName && (
//                 <p className="mt-1 text-sm text-red-400" id="lastName-error">
//                   {errors.lastName}
//                 </p>
//               )}
//             </div>
//           </div>
          
//           {/* Rest of the form remains unchanged */}
//           {/* ... form fields ... */}
//           <div>
//             <label htmlFor="location" className="block text-sm font-medium text-blue-200 mb-1">Location</label>
//             <input
//               id="location"
//               name="location"
//               type="text"
//               required
//               value={formData.location}
//               onChange={handleChange}
//               className={`appearance-none relative block w-full px-4 py-3 border ${errors.location ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
//               placeholder="City, Country"
//               aria-invalid={errors.location ? 'true' : 'false'}
//               aria-describedby={errors.location ? 'location-error' : undefined}
//             />
//             {errors.location && (
//               <p className="mt-1 text-sm text-red-400" id="location-error">
//                 {errors.location}
//               </p>
//             )}
//           </div>
          
//           <div>
//             <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-1">Email address</label>
//             <input
//               id="email"
//               name="email"
//               type="email"
//               autoComplete="email"
//               required
//               value={formData.email}
//               onChange={handleChange}
//               className={`appearance-none relative block w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
//               placeholder="Email address"
//               aria-invalid={errors.email ? 'true' : 'false'}
//               aria-describedby={errors.email ? 'email-error' : undefined}
//             />
//             {errors.email && (
//               <p className="mt-1 text-sm text-red-400" id="email-error">
//                 {errors.email}
//               </p>
//             )}
//           </div>
          
//           <div>
//             <label htmlFor="username" className="block text-sm font-medium text-blue-200 mb-1">Username</label>
//             <input
//               id="username"
//               name="username"
//               type="text"
//               required
//               value={formData.username}
//               onChange={handleChange}
//               className={`appearance-none relative block w-full px-4 py-3 border ${errors.username ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
//               placeholder="Choose a username"
//               aria-invalid={errors.username ? 'true' : 'false'}
//               aria-describedby={errors.username ? 'username-error' : undefined}
//             />
//             {errors.username && (
//               <p className="mt-1 text-sm text-red-400" id="username-error">
//                 {errors.username}
//               </p>
//             )}
//           </div>
          
//           <div>
//             <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-1">Password</label>
//             <div className="relative">
//               <input
//                 id="password"
//                 name="password"
//                 type={showPassword ? "text" : "password"}
//                 autoComplete="new-password"
//                 required
//                 value={formData.password}
//                 onChange={handleChange}
//                 className={`appearance-none relative block w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
//                 placeholder="Create a password"
//                 aria-invalid={errors.password ? 'true' : 'false'}
//                 aria-describedby={errors.password ? 'password-error' : undefined}
//               />
//               <button
//                 type="button"
//                 onClick={togglePasswordVisibility}
//                 className="absolute inset-y-0 right-0 pr-3 flex items-center"
//               >
//                 {showPassword ? (
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                   </svg>
//                 ) : (
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                   </svg>
//                 )}
//               </button>
//             </div>
//             {errors.password && (
//               <p className="mt-1 text-sm text-red-400" id="password-error">
//                 {errors.password}
//               </p>
//             )}
//             <p className="mt-1 text-xs text-blue-200">
//               Must be at least 8 characters with uppercase, lowercase, and numbers
//             </p>
//           </div>
          
//           <div>
//             <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-200 mb-1">Confirm Password</label>
//             <div className="relative">
//               <input
//                 id="confirmPassword"
//                 name="confirmPassword"
//                 type={showConfirmPassword ? "text" : "password"}
//                 autoComplete="new-password"
//                 required
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//                 className={`appearance-none relative block w-full px-4 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 border-opacity-50'} placeholder-gray-400 text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
//                 placeholder="Confirm your password"
//                 aria-invalid={errors.confirmPassword ? 'true' : 'false'}
//                 aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
//               />
//               <button
//                 type="button"
//                 onClick={toggleConfirmPasswordVisibility}
//                 className="absolute inset-y-0 right-0 pr-3 flex items-center"
//               >
//                 {showConfirmPassword ? (
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                   </svg>
//                 ) : (
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                   </svg>
//                 )}
//               </button>
//             </div>
//             {errors.confirmPassword && (
//               <p className="mt-1 text-sm text-red-400" id="confirm-password-error">
//                 {errors.confirmPassword}
//               </p>
//             )}
//           </div>
          
//           <div className="bg-blue-900 bg-opacity-25 p-3 rounded-lg border border-blue-800">
//             <div className="flex items-center mb-2">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//               </svg>
//               <span className="text-teal-300 font-medium">Wallet Connected</span>
//               <button
//                 type="button"
//                 onClick={() => setFormStep(1)}
//                 className="ml-auto text-xs text-blue-300 hover:text-blue-200"
//               >
//                 Change Wallet
//               </button>
//             </div>
//             <p className="text-blue-200 text-xs">
//               {walletType} wallet at address: <span className="text-white font-mono text-xs">{walletAddress?.slice(0, 10)}...{walletAddress?.slice(-4)}</span>
//             </p>
//           </div>
          
//           <div className="flex items-start">
//             <div className="flex items-center h-5">
//               <input
//                 id="agreeToTerms"
//                 name="agreeToTerms"
//                 type="checkbox"
//                 checked={formData.agreeToTerms}
//                 onChange={handleChange}
//                 className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//               />
//             </div>
//             <div className="ml-3 text-sm">
//               <label htmlFor="agreeToTerms" className="text-blue-200">
//                 I agree to the <a href="/terms" className="text-blue-300 hover:text-blue-200">Terms of Service</a> and <a href="/privacy" className="text-blue-300 hover:text-blue-200">Privacy Policy</a>
//               </label>
//               {errors.agreeToTerms && (
//                 <p className="mt-1 text-sm text-red-400">
//                   {errors.agreeToTerms}
//                 </p>
//               )}
//             </div>
//           </div>
          
//           <div className="flex space-x-4">
//             <button
//               type="button"
//               onClick={() => setFormStep(1)}
//               className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 border-opacity-30 text-sm font-medium rounded-lg text-blue-200 hover:bg-gray-700 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"



import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import useWallet from '../../hooks/useWallet';
import WalletConnectionStep from '../WalletConnectionStep';
import AccountDetailsStep from '../AccountDetailsStep';
import { useAppContext } from '@/context/AppContext';

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

interface UserData {
  firstName: string;
  lastName: string;
  username: string;
  location: string;
  email: string;
  walletConnected: boolean;
  walletAddress: string;
  walletType: string;
  joinDate: string;
  verified: boolean;
}

const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { walletConnected, walletType, connectWallet } = useWallet();
  const {walletAddress} = useAppContext();
  console.log(walletAddress);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    location: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    walletConnected: false,
    walletAddress: '',
    walletType: ''
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [signupError, setSignupError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [formStep, setFormStep] = useState<number>(1); // 1: Wallet connection, 2: Account details
  
  // Update form data when wallet state changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      walletConnected,
      walletAddress: walletAddress || '',
      walletType: walletType || ''
    }));
  }, [walletConnected, walletAddress, walletType]);
  
  const validateWalletStep = (): boolean => {
    if (!formData.walletConnected) {
      setSignupError('You must connect your wallet to continue');
      return false;
    }
    return true;
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // First name validation
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    // Last name validation
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    // Location validation
    if (!formData.location) {
      newErrors.location = 'Location is required';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, and numbers';
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Terms agreement
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    // Wallet validation - should already be connected due to our two-step flow
    if (!formData.walletConnected) {
      newErrors.wallet = 'Wallet connection is required';
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
    
    // Clear signup error when user modifies the form
    if (signupError) {
      setSignupError('');
    }
  };
  
  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = (): void => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const handleContinue = (): void => {
    if (validateWalletStep()) {
      setFormStep(2);
    }
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) return;
    
    setIsLoading(true);
    setSignupError('');
    
    // Simulate API call
    try {
      // API signup logic would go here
      console.log('Signup attempt with:', formData);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate username taken error (for demonstration)
      if (formData.username === 'admin' || formData.username === 'test') {
        throw new Error('Username already taken');
      }
      
      // Store user data in localStorage for the dashboard to access
      const userData: UserData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        location: formData.location,
        email: formData.email,
        walletConnected: formData.walletConnected,
        walletAddress: formData.walletAddress,
        walletType: formData.walletType,
        joinDate: new Date().toISOString(),
        verified: true
      };
      
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Redirect to dashboard on successful registration
      navigate('/dashboard');
      
      console.log('Signup successful');
    } catch (error) {
      console.error('Signup failed:', error);
      setSignupError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle wallet connection with specific wallet type
  const handleConnectWallet = (walletType: string) => {
    connectWallet(walletType);
    // Set wallet type in form data
    setFormData(prev => ({
      ...prev,
      walletType
    }));
  };
  
  // Go back to wallet connection step
  const goBack = () => {
    setFormStep(1);
  };
  
  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-gray-700 bg-opacity-10 backdrop-blur-lg rounded-xl shadow-xl border-2 border-white border-opacity-30">
      <div className="text-center">
        <h2 className="mt-2 text-3xl font-extrabold text-white">
          Join TruthChain
        </h2>
        <p className="mt-2 text-sm text-blue-200">
          Create your account to verify content with blockchain security
        </p>
      </div>
      
      {/* Step indicator */}
      <div className="flex items-center justify-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          formStep === 1 ? 'bg-blue-600 text-white' : 'bg-teal-600 text-white'
        }`}>
          1
        </div>
        <div className={`h-1 w-8 ${formStep === 1 ? 'bg-gray-600' : 'bg-teal-600'}`}></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          formStep === 1 ? 'bg-gray-600 text-gray-300' : 'bg-blue-600 text-white'
        }`}>
          2
        </div>
      </div>
      
      {/* Step labels */}
      <div className="flex items-center justify-center text-xs text-gray-300 -mt-4">
        <div className={`text-center w-24 ${formStep === 1 ? 'text-blue-300' : 'text-teal-300'}`}>
          Connect Wallet
        </div>
        <div className={`text-center w-24 ${formStep === 1 ? 'text-gray-400' : 'text-blue-300'}`}>
          Account Details
        </div>
      </div>
      
      {/* Conditional rendering of steps */}
      {formStep === 1 ? (
        <WalletConnectionStep 
          walletConnected={walletConnected}
          walletAddress={walletAddress}
          walletType={walletType}
          handleConnectWallet={handleConnectWallet}
          handleContinue={handleContinue}
          signupError={signupError}
        />
      ) : (
        <AccountDetailsStep 
          formData={formData}
          errors={errors}
          isLoading={isLoading}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          walletType={walletType}
          walletAddress={walletAddress}
          handleChange={handleChange}
          togglePasswordVisibility={togglePasswordVisibility}
          toggleConfirmPasswordVisibility={toggleConfirmPasswordVisibility}
          handleSubmit={handleSubmit}
          goBack={goBack}
        />
      )}
    </div>
  );
};

export default SignupForm;