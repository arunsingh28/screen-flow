import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/Toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '@/components/theme-provider';
import { CreditProvider } from '@/contexts/CreditContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/react-query';
import { routes } from '@/config/routes.config';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { WebSocketConsole } from '@/components/debug/WebSocketConsole';
import { TooltipProvider } from '@/components/ui/tooltip';

import { usePageTracking } from '@/hooks/usePageTracking';

function RootLayout() {
  usePageTracking();
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CreditProvider initialCredits={100}>
            <ThemeProvider defaultTheme="system" storageKey="hyrmate-ui-theme">
              <TooltipProvider>
                <Outlet />
                <Toaster />
                <WebSocketConsole />
              </TooltipProvider>
            </ThemeProvider>
          </CreditProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: routes,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
