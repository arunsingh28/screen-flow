
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
  Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { useCredits } from '@/contexts/CreditContext';
import { CircularProgress } from '@/components/ui/circular-progress';
import { CreditPurchaseModal } from '@/components/credits/CreditPurchaseModal';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes.constants';

const Header: React.FC = () => {
  const location = useLocation();
  const { setTheme, theme } = useTheme();
  const { credits, maxCredits } = useCredits();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const navItems = [
    { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { path: ROUTES.JOBS_LIST, label: 'Jobs', icon: Briefcase },
    { path: ROUTES.SEARCH, label: 'AI Search', icon: Sparkles },
    { path: ROUTES.LIBRARY, label: 'CV Library', icon: FolderOpen },
  ];

  const notifications = [
    { id: 1, title: 'Analysis Complete', desc: 'Batch "Engineering Q1" processed successfully.', time: '2m ago', unread: true },
    { id: 2, title: 'New High Match', desc: 'Sarah Connor matches 92% for Frontend Lead.', time: '1h ago', unread: true },
    { id: 3, title: 'System Update', desc: 'Scheduled maintenance tonight at 2 AM.', time: '5h ago', unread: false },
  ];

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

      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
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
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => setShowCreditModal(true)}
            >
              <CircularProgress value={credits} max={maxCredits} size={10} strokeWidth={3} />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Credits</span>
                <span className="text-sm">{credits}</span>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="hidden sm:flex bg-muted rounded-full p-1 border">
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
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-600 rounded-full ring-2 ring-background" />
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-md border bg-card shadow-lg animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="text-sm font-semibold">Notifications</span>
                    <span className="text-xs text-primary cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  <div className="py-2 max-h-[300px] overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="px-4 py-3 hover:bg-muted/50 cursor-pointer flex gap-3">
                        <div className={cn("mt-1 h-2 w-2 rounded-full flex-shrink-0", notif.unread ? "bg-blue-500" : "bg-transparent")} />
                        <div>
                           <p className={cn("text-sm", notif.unread ? "font-medium text-foreground" : "text-muted-foreground")}>{notif.title}</p>
                           <p className="text-xs text-muted-foreground line-clamp-1">{notif.desc}</p>
                           <p className="text-[10px] text-muted-foreground mt-1">{notif.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar & Dropdown */}
            <div className="relative z-50 hidden sm:block">
              <div 
                className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-medium shadow-sm cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-background"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
              >
                  JD
              </div>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border bg-card shadow-lg animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium">Jane Doe</p>
                    <p className="text-xs text-muted-foreground">jane.doe@screenflow.ai</p>
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
                  <div className="p-1 border-t">
                    <button 
                      className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-sm"
                      onClick={() => alert("Logged Out")}
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
                    <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center text-xs">
                        JD
                    </div>
                    <span>Jane Doe</span>
                 </div>
                 <button 
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                    onClick={() => alert("Logged Out")}
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
