import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { mutate: login, isPending, isError, error } = useLogin();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login({ email, password });
    };

    const handleGoogleLogin = () => {
        console.log('Google login clicked');
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Sign in to your account to continue</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {isError && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                                {error instanceof Error ? error.message : 'Login failed. Please try again.'}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Signing in...' : 'Sign In'}
                        </Button>
                        <div className="relative w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleGoogleLogin}
                        >
                            Login with Google
                        </Button>
                        <p className="text-sm text-center text-muted-foreground">
                            Don't have an account?{' '}
                            <Link to={ROUTES.SIGNUP} className="text-primary hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
