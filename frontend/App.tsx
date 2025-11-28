import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { CreditProvider } from '@/contexts/CreditContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/react-query';
import { routes } from '@/config/routes.config';

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CreditProvider initialCredits={100}>
          <ThemeProvider defaultTheme="system" storageKey="screenflow-ui-theme">
            <Outlet />
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
