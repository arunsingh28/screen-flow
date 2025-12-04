import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsSubmitted(true);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <Card className="border-none shadow-none hover:shadow-none">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Forgot password</CardTitle>
                <CardDescription>
                    Enter your email address and we will send you a link to reset your password
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isSubmitted ? (
                    <div className="text-center space-y-4">
                        <div className="text-sm text-green-600 font-medium">
                            Check your email for a reset link.
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                            Try another email
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full" type="submit" disabled={isLoading || !email}>
                            {isLoading ? 'Sending link...' : 'Send Reset Link'}
                        </Button>
                    </form>
                )}
            </CardContent>
            <CardFooter>
                <div className="text-sm text-muted-foreground text-center w-full">
                    Remember your password?{' '}
                    <Link to={ROUTES.LOGIN} className="hover:text-primary underline underline-offset-4">
                        Sign in
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
