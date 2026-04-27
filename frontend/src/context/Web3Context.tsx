import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TextileBridge, createBrowserClients, createLocalClients, ActorRole } from '../../../backend/contractBridge'; // Note: importing directly from backend

interface Web3ContextState {
  bridge: TextileBridge | null;
  account: string | null;
  isConnected: boolean;
  userRole: string | null;
  userName: string | null;
  userReputation: string | null;
  isAdmin: boolean;
  connectWallet: (customAddress?: string) => Promise<void>;
  disconnectWallet: () => void;
  error: string | null;
}

const Web3Context = createContext<Web3ContextState | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bridge, setBridge] = useState<TextileBridge | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userReputation, setUserReputation] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async (customAddress?: string) => {
    try {
      setError(null);
      let clients;
      if (customAddress && customAddress.trim().length > 0) {
        clients = await createLocalClients(customAddress.trim());
      } else {
        clients = await createBrowserClients();
      }
      const { publicClient, walletClient, account } = clients;
      const newBridge = new TextileBridge(publicClient, walletClient, account);
      setBridge(newBridge);
      setAccount(account);

      // Fetch user role info
      try {
        const actorData = await newBridge.actors(account as any) as any;
        if (actorData && actorData[4]) { // isActive is index 4 in the tuple
          const roleId = actorData[1]; // role is index 1
          const roleName = Object.keys(ActorRole).find(key => ActorRole[key as keyof typeof ActorRole] === roleId);
          setUserRole(roleName || 'Unknown Role');
          setUserName(actorData[2]); // name is index 2
          setUserReputation(actorData[7].toString()); // reputation is index 7
        } else {
          setUserRole('Unregistered');
          setUserName(null);
          setUserReputation(null);
        }
        const adminAddr = await newBridge.admin();
        setIsAdmin(adminAddr.toLowerCase() === account.toLowerCase());
      } catch (e) {
        console.error('Failed to fetch role info', e);
      }
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      const errMsg = err.shortMessage || err.details || err.message || 'Failed to connect wallet';
      setError(errMsg);
    }
  };

  const disconnectWallet = () => {
    setBridge(null);
    setAccount(null);
    setUserRole(null);
    setUserName(null);
    setUserReputation(null);
    setIsAdmin(false);
  };

  // Automatically listen for account changes in MetaMask
  React.useEffect(() => {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.ethereum) {
      // @ts-ignore
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          // Re-connect to update the bridge with the new account
          connectWallet();
        } else {
          // User disconnected all accounts
          setBridge(null);
          setAccount(null);
          setUserRole(null);
          setUserName(null);
          setUserReputation(null);
          setIsAdmin(false);
        }
      };

      // @ts-ignore
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      // @ts-ignore
      window.ethereum.on('chainChanged', () => window.location.reload());

      return () => {
        // @ts-ignore
        if (window.ethereum.removeListener) {
          // @ts-ignore
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        bridge,
        account,
        isConnected: !!account,
        userRole,
        userName,
        userReputation,
        isAdmin,
        connectWallet,
        disconnectWallet,
        error,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
