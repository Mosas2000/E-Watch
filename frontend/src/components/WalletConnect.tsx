import { showConnect } from '@stacks/connect';
import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

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
    showConnect({
      appDetails: {
        name: 'E-Watch',
        icon: window.location.origin + '/logo.png',
      },
      redirectTo: '/',
      onFinish: () => {
        window.location.reload();
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
