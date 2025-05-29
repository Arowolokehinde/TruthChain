import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  // Add other user properties as needed
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
  // Add other auth functions as needed
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};

interface AuthContextProviderProps {
  children: ReactNode;
}

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const isAuthenticated = user !== null;

  const login = async (email: string, password: string) => {
    // Implement your login logic here
    try {
      // Example login implementation:
      // const response = await api.login(email, password);
      // setUser(response.user);
      console.log("Login with:", email);
      // Mock user for development
      setUser({
        id: '123',
        name: 'Test User',
        email: email,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Implement your logout logic here
    setUser(null);
  };

  const signup = async (name: string, email: string, password: string) => {
    // Implement your signup logic here
    try {
      // Example signup implementation:
      // const response = await api.signup(name, email, password);
      // setUser(response.user);
      console.log("Signup with:", name, email);
      // Mock user for development
      setUser({
        id: '123',
        name: name,
        email: email,
      });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    login,
    logout,
    signup,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};