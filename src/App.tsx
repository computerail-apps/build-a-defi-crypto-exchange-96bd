import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeftRight, LineChart, History as HistoryIcon } from 'lucide-react';
import { Nav, NavLink } from '@/lib/ui/Nav';
import { WalletProvider } from '@/lib/wallet-context';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { Swap } from '@/pages/Swap';
import { Markets } from '@/pages/Markets';
import { History } from '@/pages/History';

type View = 'swap' | 'markets' | 'history';

const queryClient = new QueryClient();

export default function App() {
  const [view, setView] = useState<View>('swap');

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <div className="min-h-screen">
          <Nav
            brand={<span>Veyra</span>}
            actions={<WalletConnectButton />}
          >
            <NavLink href="#" active={view === 'swap'} onClick={() => setView('swap')}>
              <ArrowLeftRight size={14} className="mr-2" />
              Swap
            </NavLink>
            <NavLink href="#" active={view === 'markets'} onClick={() => setView('markets')}>
              <LineChart size={14} className="mr-2" />
              Markets
            </NavLink>
            <NavLink href="#" active={view === 'history'} onClick={() => setView('history')}>
              <HistoryIcon size={14} className="mr-2" />
              History
            </NavLink>
          </Nav>
          <main className="py-8 md:py-12">
            {view === 'swap' && <Swap />}
            {view === 'markets' && <Markets />}
            {view === 'history' && <History />}
          </main>
        </div>
      </WalletProvider>
    </QueryClientProvider>
  );
}
