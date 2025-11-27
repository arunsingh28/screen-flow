import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { ThemeProvider } from '@/components/theme-provider';
import { CreditProvider } from '@/contexts/CreditContext';
import { routes } from '@/config/routes.config';

function RootLayout() {
  return (
    <CreditProvider initialCredits={100}>
      <ThemeProvider defaultTheme="system" storageKey="screenflow-ui-theme">
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <Header />
          <Outlet />
        </div>
      </ThemeProvider>
    </CreditProvider>
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
