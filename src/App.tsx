import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './hooks/useLanguage';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { OfflineBanner } from './components/common/OfflineBanner';
import { HomePage } from './pages/HomePage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { PlayerDetailPage } from './pages/PlayerDetailPage';
import { LeaderboardsPage } from './pages/LeaderboardsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <HashRouter>
          <div className="min-h-screen flex flex-col bg-page text-main">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/teams/:teamId" element={<TeamDetailPage />} />
                <Route path="/players/:personId" element={<PlayerDetailPage />} />
                <Route path="/leaders" element={<LeaderboardsPage />} />
              </Routes>
            </main>
            <Footer />
            <OfflineBanner />
          </div>
        </HashRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
