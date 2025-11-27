
import React, { useState } from 'react';
import { User, Bell, Monitor, Moon, Sun, Laptop, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useTheme } from '../../../components/theme-provider';
import { cn } from '../../../lib/utils';

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings, preferences, and security.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Update your personal account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" defaultValue="Jane" placeholder="Enter your first name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" defaultValue="Doe" placeholder="Enter your last name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" defaultValue="jane.doe@company.com" placeholder="Enter your email" />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={handleSave} disabled={loading}>Save Profile</Button>
          </CardFooter>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize the interface theme.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div 
                className={cn(
                  "cursor-pointer rounded-lg border-2 p-4 hover:bg-accent hover:text-accent-foreground transition-all flex flex-col items-center gap-2",
                  theme === 'light' ? "border-primary bg-primary/5" : "border-muted"
                )}
                onClick={() => setTheme('light')}
              >
                <Sun className="h-6 w-6" />
                <span className="font-medium">Light</span>
              </div>
              <div 
                className={cn(
                  "cursor-pointer rounded-lg border-2 p-4 hover:bg-accent hover:text-accent-foreground transition-all flex flex-col items-center gap-2",
                  theme === 'dark' ? "border-primary bg-primary/5" : "border-muted"
                )}
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-6 w-6" />
                <span className="font-medium">Dark</span>
              </div>
              <div 
                className={cn(
                  "cursor-pointer rounded-lg border-2 p-4 hover:bg-accent hover:text-accent-foreground transition-all flex flex-col items-center gap-2",
                  theme === 'system' ? "border-primary bg-primary/5" : "border-muted"
                )}
                onClick={() => setTheme('system')}
              >
                <Laptop className="h-6 w-6" />
                <span className="font-medium">System</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Batch Processing Complete</Label>
                <p className="text-sm text-muted-foreground">
                  Receive an email when your CV bulk uploads are finished analyzing.
                </p>
              </div>
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-primary" defaultChecked />
            </div>
          </CardContent>
        </Card>

         {/* Security */}
         <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
             <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Password last changed 3 months ago</div>
                <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                    Reset Password
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
