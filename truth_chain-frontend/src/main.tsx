import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Connect } from '@stacks/connect-react';
import { Toaster } from 'react-hot-toast'
import { AuthContextProvider } from './context/AuthContext'
import App from './App';
import './index.css';

// Configure Connect for Stacks authentication
const appConfig = {
  name: 'TruthChain',
  icon: window.location.origin + '/logo.png',
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthContextProvider>
      <Connect authOptions={{ appDetails: appConfig }}>
        <App />
        <Toaster />
      </Connect>
    </AuthContextProvider>
  </StrictMode>
);
