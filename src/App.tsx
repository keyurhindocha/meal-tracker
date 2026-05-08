import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import TodayPage from './pages/TodayPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
// import SuggestPage from './pages/SuggestPage';
import OverviewPage from './pages/OverviewPage';
import LoginPage from './pages/LoginPage';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TodayPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          {/* <Route path="/suggest" element={<SuggestPage />} /> */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
