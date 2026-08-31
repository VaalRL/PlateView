import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './hooks/useLanguage';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { OfflineBanner } from './components/common/OfflineBanner';
import { HomePage } from './pages/HomePage';

// Route-level code splitting keeps the initial bundle to the home page
const TeamDetailPage = lazy(() =>
  import('./pages/TeamDetailPage').then((m) => ({ default: m.TeamDetailPage }))
);
const PlayerDetailPage = lazy(() =>
  import('./pages/PlayerDetailPage').then((m) => ({ default: m.PlayerDetailPage }))
);
const LeaderboardsPage = lazy(() =>
  import('./pages/LeaderboardsPage').then((m) => ({ default: m.LeaderboardsPage }))
);

const RouteFallback: React.FC = () => (
  <div className="flex justify-center py-24">
    <div className="w-6 h-6 border-2 border-team-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/teams/:teamId" element={<TeamDetailPage />} />
                  <Route path="/players/:personId" element={<PlayerDetailPage />} />
                  <Route path="/leaders" element={<LeaderboardsPage />} />
                </Routes>
              </Suspense>
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
