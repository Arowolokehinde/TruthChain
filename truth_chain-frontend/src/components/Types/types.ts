// types.ts - Store these types in a separate file for reuse across components

export interface FormData {
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
  
  export interface FormErrors {
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
  
  export interface UserData {
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