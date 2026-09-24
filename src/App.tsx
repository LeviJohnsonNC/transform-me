import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { createAppQueryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Today } from "@/pages/Today";
import { History } from "@/pages/History";
import { Records } from "@/pages/Records";
import { Settings } from "@/pages/Settings";
import { Auth } from "@/pages/Auth";
import { ResetPassword } from "@/pages/ResetPassword";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "./pages/NotFound";

const queryClient = createAppQueryClient();

const AppContent = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  
  const handleNavigate = (route: string) => {
    window.history.pushState({}, '', route);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Password recovery always takes priority over the auth redirect
  const isRecovery =
    location.pathname === '/reset-password' ||
    window.location.hash.includes('type=recovery');

  if (isRecovery) {
    return <ResetPassword />;
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <Auth />;
  }

  // Show main app if logged in
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Today />} />
        <Route path="/history" element={<History />} />
        <Route path="/records" element={<Records />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Navigation currentRoute={location.pathname} onNavigate={handleNavigate} />
    </div>
  );
};

const App = () => (
  // Outermost, so a throw in any provider below it is still caught rather than
  // taking the whole tree down to a blank screen.
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
