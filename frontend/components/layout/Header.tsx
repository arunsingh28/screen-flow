
import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Settings,
  FolderOpen,
  LayoutDashboard,
  Sun,
  Moon,
  Laptop,
  Bell,
  Menu,
  X,
  LogOut,
  Briefcase,
  Sparkles,
  User,
  Coins,
  Gift
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { useLogout } from '@/hooks/useAuth';
import { useCredits } from '@/contexts/CreditContext';
import { CircularProgress } from '@/components/ui/circular-progress';
import { CreditPurchaseModal } from '@/components/credits/CreditPurchaseModal';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes.constants';
import { userService } from '@/services/user.service';
import { jobsApi } from '@/services/jobs.service';
import { formatDistanceToNow } from 'date-fns';

const Header: React.FC = () => {
  const location = useLocation();
  const { setTheme, theme } = useTheme();
  const { credits, maxCredits } = useCredits();
  const { mutate: logout } = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  // Fetch user profile
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userService.getProfile,
  });

  // Fetch recent activities for notifications
  const { data: activities = [] } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: () => jobsApi.getActivities(0, 5),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase();
    }
    if (userProfile?.email) {
      return userProfile.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    return userProfile?.email?.split('@')[0] || 'User';
  };


  const navItems = [
    { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { path: ROUTES.JOBS_LIST, label: 'Jobs', icon: Briefcase },
    { path: ROUTES.SEARCH, label: 'AI Search', icon: Sparkles },
    { path: ROUTES.LIBRARY, label: 'CV Library', icon: FolderOpen },
    { path: ROUTES.REFERRALS, label: 'Refer & Earn', icon: Gift },
  ];

  // Convert activities to notifications format
  const notifications = activities.map((activity: any) => ({
    id: activity.id,
    title: activity.activity_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    desc: activity.description,
    time: formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }),
    unread: false, // We don't have read/unread tracking yet
  }));

  const hasUnreadNotifications = notifications.length > 0;

  const closeMenus = () => {
    setShowUserMenu(false);
    setShowNotifications(false);
  };

  return (
    <>
      {/* Overlay to close menus when clicking outside */}
      {(showUserMenu || showNotifications) && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={closeMenus} />
      )}

      <header className="border-b bg-card/95 backdrop-blur dark:border-gray-700 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          {/* Logo */}
          <Link to={ROUTES.DASHBOARD} className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
              S
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:inline-block">QuikHR</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Credits Display */}
            <div
              className="hidden lg:flex items-center gap-3 px-1 pr-3 py-0.5 rounded-full border dark:border-gray-800 bg-card/50 hover:bg-accent/50 hover:border-primary/20 transition-all cursor-pointer group shadow-sm"
              onClick={() => setShowCreditModal(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setShowCreditModal(true)}
            >
              <div className="relative flex items-center justify-center">
                <CircularProgress
                  value={credits}
                  max={maxCredits}
                  size={28}
                  strokeWidth={5}
                  className="text-[#1fad58] group-hover:text-[#1fad58]/80"
                />
              </div>
              <div className="flex flex-col items-start -space-y-0.5">
                <span className="text-[10px] font-sans font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary/80 transition-colors">
                  Available
                </span>
                <span className="text-sm font-bold font-mono tracking-tight text-foreground">
                  {credits}
                  <span className="text-muted-foreground/60 font-medium ml-0.5 text-xs">/ {maxCredits}</span>
                </span>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="hidden sm:flex bg-muted rounded-full p-1 border dark:border-gray-700">
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "p-1.5 rounded-full transition-all",
                  theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="Light mode"
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={cn(
                  "p-1.5 rounded-full transition-all",
                  theme === 'system' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="System mode"
              >
                <Laptop className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "p-1.5 rounded-full transition-all",
                  theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="Dark mode"
              >
                <Moon className="h-4 w-4" />
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative z-50">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground relative"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
              >
                <Bell className="h-5 w-5" />
                {hasUnreadNotifications && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-600 rounded-full ring-2 ring-background" />
                )}
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-md border dark:border-gray-700 bg-card shadow-lg animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                    <span className="text-sm font-semibold">Recent Activity</span>
                    <Link to={ROUTES.ACTIVITY_LOG} className="text-xs text-primary cursor-pointer hover:underline" onClick={() => setShowNotifications(false)}>
                      View all
                    </Link>
                  </div>
                  <div className="py-2 max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif.id} className="px-4 py-3 hover:bg-muted/50 cursor-pointer flex gap-3">
                          <div className={cn("mt-1 h-2 w-2 rounded-full flex-shrink-0", notif.unread ? "bg-blue-500" : "bg-gray-400")} />
                          <div className="flex-1">
                            <p className={cn("text-sm", notif.unread ? "font-medium text-foreground" : "text-foreground")}>{notif.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{notif.desc}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{notif.time}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No recent activity
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar & Dropdown */}
            <div className="relative z-50 hidden sm:block">
              {userProfile?.profile_image_url ? (
                <img
                  src={userProfile.profile_image_url}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover shadow-sm cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-background"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                />
              ) : (
                <div
                  className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-medium shadow-sm cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-background text-xs"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                >
                  {getUserInitials()}
                </div>
              )}

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border dark:border-gray-800 bg-card shadow-lg animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b dark:border-gray-700">
                    <p className="text-sm font-medium">{getDisplayName()}</p>
                    <p className="text-xs text-muted-foreground truncate">{userProfile?.email || 'No email'}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      to={ROUTES.PROFILE}
                      className="flex w-full items-center px-3 py-2 text-sm text-foreground hover:bg-muted rounded-sm"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      Profile
                    </Link>
                    <Link
                      to={ROUTES.CREDITS}
                      className="flex w-full items-center px-3 py-2 text-sm text-foreground hover:bg-muted rounded-sm"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Coins className="mr-2 h-4 w-4 text-muted-foreground" />
                      Credits
                    </Link>
                    <Link
                      to={ROUTES.SETTINGS}
                      className="flex w-full items-center px-3 py-2 text-sm text-foreground hover:bg-muted rounded-sm"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                      Settings
                    </Link>
                  </div>
                  <div className="p-1 border-t dark:border-gray-700">
                    <button
                      className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-sm"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-card p-4 shadow-lg animate-in slide-in-from-top-5">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to={ROUTES.SETTINGS}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <Settings className="h-4 w-4" />
                Settings
              </NavLink>
              <div className="border-t my-2 pt-2">
                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground">
                  {userProfile?.profile_image_url ? (
                    <img
                      src={userProfile.profile_image_url}
                      alt="Profile"
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center text-xs">
                      {getUserInitials()}
                    </div>
                  )}
                  <span className="truncate">{getDisplayName()}</span>
                </div>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
      />
    </>
  );
};

export default Header;
