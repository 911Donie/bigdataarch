import React, { useState } from 'react';
import { TelecomProvider } from './context/TelecomContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ExplainModal } from './components/ExplainModal';

// Pages
import { OverviewDashboard } from './pages/OverviewDashboard';
import { LiveTrafficMonitor } from './pages/LiveTrafficMonitor';
import { CongestionAnomalyPage } from './pages/CongestionAnomalyPage';

export function AppContent() {
  const [currentPage, setCurrentPage] = useState<string>('overview');

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewDashboard />;
      case 'live-traffic':
        return <LiveTrafficMonitor />;
      case 'congestion':
        return <CongestionAnomalyPage />;
      default:
        return <OverviewDashboard />;
    }
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar onOpenViva={() => setCurrentPage('learning')} />

      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Persistent Sidebar */}
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderPage()}
        </main>
      </div>

      {/* Global 5-Part Explainability Modal */}
      <ExplainModal />
    </div>
  );
}

export default function App() {
  return (
    <TelecomProvider>
      <AppContent />
    </TelecomProvider>
  );
}
