import * as stacksConnect from '@stacks/connect';
import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

const { AppConfig, showConnect, UserSession } = stacksConnect;

export const WalletConnect = () => {
  const { userSession, isAuthenticated, userAddress, setUserAddress } = useApp();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    try {
      if (userSession.isSignInPending()) {
        userSession.handlePendingSignIn().then((userData) => {
          setUserData(userData);
          setUserAddress(userData?.profile?.stxAddress?.mainnet || '');
        }).catch((error) => {
          console.error('Sign in error:', error);
        });
      } else if (userSession.isUserSignedIn()) {
        const data = userSession.loadUserData();
        setUserData(data);
        setUserAddress(data?.profile?.stxAddress?.mainnet || '');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  }, [userSession, setUserAddress]);

  const connectWallet = () => {
    if (typeof showConnect !== 'function') {
      console.error('showConnect is not available:', typeof showConnect);
      console.log('Available exports:', Object.keys(stacksConnect));
      return;
    }

    const appDetails = {
      name: 'E-Watch',
      icon: window.location.origin + '/logo.png',
    };

    showConnect({
      appDetails,
      onFinish: () => {
        const userData = userSession.loadUserData();
        setUserData(userData);
        setUserAddress(userData?.profile?.stxAddress?.mainnet || '');
      },
      onCancel: () => {
        console.log('User cancelled connection');
      },
      userSession,
    });
  };

  const disconnectWallet = () => {
    userSession.signUserOut('/');
    window.location.reload();
  };

  return (
    <div className="wallet-connect">
      {isAuthenticated && userAddress ? (
        <div>
          <p>Connected: {userAddress}</p>
          <button onClick={disconnectWallet}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
};
