import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Nav, NavLink } from '@/lib/ui/Nav';
import { ArrowLeftRight, LineChart, History as HistoryIcon } from 'lucide-react';
import { WalletProvider } from '@/lib/wallet-context';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { SwapPage } from '@/pages/Swap';
import { MarketsPage } from '@/pages/Markets';
import { HistoryPage } from '@/pages/History';

function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const go = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <Nav
      brand={
        <span className="font-semibold tracking-tight">
          Veyra
        </span>
      }
      actions={<WalletConnectButton />}
    >
      <NavLink href="/" active={location.pathname === '/'} onClick={go('/')}>
        <ArrowLeftRight size={14} className="mr-2" />
        Swap
      </NavLink>
      <NavLink href="/markets" active={location.pathname === '/markets'} onClick={go('/markets')}>
        <LineChart size={14} className="mr-2" />
        Markets
      </NavLink>
      <NavLink href="/history" active={location.pathname === '/history'} onClick={go('/history')}>
        <HistoryIcon size={14} className="mr-2" />
        History
      </NavLink>
    </Nav>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <TopNav />
          <main className="py-8 md:py-12">
            <Routes>
              <Route path="/" element={<SwapPage />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
}
