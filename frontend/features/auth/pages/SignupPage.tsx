import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSignup } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const { mutate: signup, isPending, isError, error } = useSignup();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        signup({ email, password, company_name: companyName });
    };

    const handleGoogleSignup = () => {
        console.log('Google signup clicked');
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Sign up to get started with ScreenFlow</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {isError && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                                {error instanceof Error ? error.message : 'Signup failed. Please try again.'}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="company">Company Name</Label>
                            <Input
                                id="company"
                                type="text"
                                placeholder="Your Company"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                            />
                        </div>
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
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                            <p className="text-xs text-muted-foreground">
                                Password must be at least 8 characters long
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Creating account...' : 'Create Account'}
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
                            onClick={handleGoogleSignup}
                        >
                            Signup with Google
                        </Button>
                        <p className="text-sm text-center text-muted-foreground">
                            Already have an account?{' '}
                            <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
