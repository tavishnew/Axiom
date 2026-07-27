import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';

const queryClient = new QueryClient();

// Pages
import LandingPage from './app/landing/page';
import SignInPage from './app/auth/sign-in/page';
import SignUpPage from './app/auth/sign-up/page';
import PoliciesPage from './app/policies/page';
import EntitiesPage from './app/entities/page';
import ResourcesPage from './app/resources/page';
import DecisionsPage from './app/decisions/page';
import TestConsolePage from './app/test/page';
import SettingsPage from './app/settings/page';

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}

function DashboardRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
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
        <Route path="/policies" component={() => <DashboardRoute component={PoliciesPage} />} />
        <Route path="/entities" component={() => <DashboardRoute component={EntitiesPage} />} />
        <Route path="/resources" component={() => <DashboardRoute component={ResourcesPage} />} />
        <Route path="/decisions" component={() => <DashboardRoute component={DecisionsPage} />} />
        <Route path="/test" component={() => <DashboardRoute component={TestConsolePage} />} />
        {/* <Route path="/settings" component={() => <DashboardRoute component={SettingsPage} />} /> */}
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
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
