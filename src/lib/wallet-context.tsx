import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface WalletState {
  connected: boolean;
  address: string | null;
  chainName: string;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

// Phase 1: local connect/disconnect toggle so every screen can preview the
// connected state immediately. Phase 2 swaps this for a real wagmi injected
// connector against window.ethereum.
const MOCK_ADDRESS = '0x71C7656EC7ab88b098defB751B7401B5f6d8976';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => setConnected(true), []);
  const disconnect = useCallback(() => setConnected(false), []);

  const value = useMemo<WalletState>(
    () => ({
      connected,
      address: connected ? MOCK_ADDRESS : null,
      chainName: 'Ethereum Mainnet',
      connect,
      disconnect,
    }),
    [connected, connect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
