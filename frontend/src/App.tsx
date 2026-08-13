import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AuthProvider, ProtectedRoute } from '@/lib/auth.tsx';
import { ConfirmProvider } from '@/components/ConfirmProvider';

// Pages
import LandingPage from './app/landing/page';
import SignInPage from './app/auth/sign-in/page';
import SignUpPage from './app/auth/sign-up/page';
import ForgotPasswordPage from './app/auth/forgot-password/page';
import ResetPasswordPage from './app/auth/reset-password/page';
import DashboardPage from './app/dashboard/page';
import PoliciesPage from './app/policies/page';
import EntitiesPage from './app/entities/page';
import ResourcesPage from './app/resources/page';
import DecisionsPage from './app/decisions/page';
import AuditLogsPage from './app/audit-logs/page';
import TestConsolePage from './app/test/page';
import SettingsPage from './app/settings/page';
import InvitePage from './app/invite/[token]/page';

const queryClient = new QueryClient();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}

function ProtectedDashboardRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Component />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/landing" component={LandingPage} />
        <Route path="/auth/sign-in" component={SignInPage} />
        <Route path="/auth/sign-up" component={SignUpPage} />
        <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
        <Route path="/auth/reset-password" component={ResetPasswordPage} />
        <Route path="/invite/:token" component={InvitePage} />
        <Route path="/dashboard" component={() => <ProtectedDashboardRoute component={DashboardPage} />} />
        <Route path="/policies" component={() => <ProtectedDashboardRoute component={PoliciesPage} />} />
        <Route path="/entities" component={() => <ProtectedDashboardRoute component={EntitiesPage} />} />
        <Route path="/resources" component={() => <ProtectedDashboardRoute component={ResourcesPage} />} />
        <Route path="/decisions" component={() => <ProtectedDashboardRoute component={DecisionsPage} />} />
        <Route path="/audit-logs" component={() => <ProtectedDashboardRoute component={AuditLogsPage} />} />
        <Route path="/test" component={() => <ProtectedDashboardRoute component={TestConsolePage} />} />
        <Route path="/settings" component={() => <ProtectedDashboardRoute component={SettingsPage} />} />
        <Route path="/settings/*" component={() => <ProtectedDashboardRoute component={SettingsPage} />} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <ConfirmProvider>
              <Router />
            </ConfirmProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;