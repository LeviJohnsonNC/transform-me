import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { createAppQueryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { resumePath, writeResume, RESUMABLE_PATHS } from "@/lib/resumeState";
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
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Cold launch: go back to the tab you were on, if you left it recently.
  // Waits for the session, since the signed-out branch renders Auth whatever
  // the path, and runs once — after that the user is steering.
  const resumeChecked = useRef(false);
  useEffect(() => {
    if (loading || !user || resumeChecked.current) return;
    resumeChecked.current = true;
    const target = resumePath(location.pathname);
    if (target) navigate(target, { replace: true });
  }, [loading, user, location.pathname, navigate]);

  // Remember the tab. Only the main tabs, so an auth or reset URL is never
  // what a later launch reopens. Must stay declared AFTER the restore effect:
  // both run in the same commit, and this one writes the launch path ("/"),
  // which would clobber the saved tab if it ran first.
  useEffect(() => {
    if (!user) return;
    if ((RESUMABLE_PATHS as readonly string[]).includes(location.pathname)) {
      writeResume({ path: location.pathname });
    }
  }, [user, location.pathname]);
  
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
