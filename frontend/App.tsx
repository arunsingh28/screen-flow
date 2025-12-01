import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '@/components/theme-provider';
import { CreditProvider } from '@/contexts/CreditContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/react-query';
import { routes } from '@/config/routes.config';
import { cn } from '@/lib/utils';

import { usePageTracking } from '@/hooks/usePageTracking';

function RootLayout() {
  usePageTracking();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CreditProvider initialCredits={100}>
          <ThemeProvider defaultTheme="system" storageKey="screenflow-ui-theme">
            <Outlet />
            <Toaster />
          </ThemeProvider>
        </CreditProvider>
      </AuthProvider>
    </QueryClientProvider>
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
