import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppConfig, UserSession } from '@stacks/connect';

interface AppContextType {
  userAddress: string;
  setUserAddress: (address: string) => void;
  networkType: string;
  setNetworkType: (network: string) => void;
  isAuthenticated: boolean;
  userSession: UserSession;
}

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userAddress, setUserAddress] = useState('');
  const [networkType, setNetworkType] = useState('mainnet');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        setUserAddress(userData?.profile?.stxAddress?.mainnet || '');
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  return (
    <AppContext.Provider 
      value={{ 
        userAddress, 
        setUserAddress, 
        networkType, 
        setNetworkType,
        isAuthenticated,
        userSession
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
