
import { useState } from 'react';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import CreateJobPage from './features/jobs/pages/CreateJobPage';
import JobsListPage from './features/jobs/pages/JobsListPage';
import JobDetailsPage from './features/jobs/pages/JobDetailsPage';
import SettingsPage from './features/settings/pages/SettingsPage';
import CVLibraryPage from './features/library/pages/CVLibraryPage';
import SearchPage from './features/search/pages/SearchPage';
import ActivityLogPage from './features/activity/pages/ActivityLogPage';
import ComingSoon from './components/shared/ComingSoon';
import Header from './components/layout/Header';
import { ThemeProvider } from './components/theme-provider';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentView} />;
      case 'jobs-list':
        return <JobsListPage onNavigate={setCurrentView} />;
      case 'job-details':
        return <JobDetailsPage onBack={() => setCurrentView('jobs-list')} />;
      case 'create-job':
        return <CreateJobPage />;
      case 'settings':
        return <SettingsPage />;
      case 'search':
        return <SearchPage />;
      case 'library':
        return <CVLibraryPage onNavigate={setCurrentView} />;
      case 'activity-log':
        return <ActivityLogPage />;
      default:
        return <ComingSoon pageName={currentView} onReturnHome={() => setCurrentView('dashboard')} />;
    }
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="screenflow-ui-theme">
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <Header currentView={currentView} onNavigate={setCurrentView} />
        {renderContent()}
      </div>
    </ThemeProvider>
  );
}

export default App;
