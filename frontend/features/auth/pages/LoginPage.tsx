import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        <>
            <div className="mb-8 flex flex-col items-center lg:items-start text-center lg:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Welcome back
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Please sign in to your ScreenFlow account to manage your candidate pipeline.
                </p>
            </div>
            <div className="grid gap-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
                                htmlFor="email"
                            >
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-transparent border-slate-200"
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <label
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
                                    htmlFor="password"
                                >
                                    Password
                                </label>
                                <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                                    Forgot password?
                                </a>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-transparent border-slate-200"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full text-white"
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-500">Or continue with</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 h-10 px-4 py-2 w-full text-slate-700"
                >
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M12.0003 20.45C16.667 20.45 20.5836 16.5333 20.5836 11.8667H12.0003V11.8667H20.5836C20.5836 7.2 16.667 3.28333 12.0003 3.28333C7.33366 3.28333 3.41699 7.2 3.41699 11.8667C3.41699 16.5333 7.33366 20.45 12.0003 20.45Z" fill="currentColor" fillOpacity="0" stroke="currentColor" />
                        <path d="M20.9 10.2H20.4V10H12V14H17.2C16.5 16.1 14.5 17.6 12 17.6C8.9 17.6 6.4 15.1 6.4 12C6.4 8.9 8.9 6.4 12 6.4C13.4 6.4 14.7 6.9 15.7 7.8L18.5 5C16.8 3.4 14.5 2.4 12 2.4C6.7 2.4 2.4 6.7 2.4 12C2.4 17.3 6.7 21.6 12 21.6C17.3 21.6 21.6 17.3 21.6 12C21.6 11.4 21.5 10.8 21.4 10.2H20.9Z" fill="currentColor" />
                    </svg>
                    Google
                </button>

                <p className="px-8 text-center text-sm text-slate-500">
                    Don't have an account?{" "}
                    <Link to={ROUTES.SIGNUP} className="underline underline-offset-4 hover:text-primary-600">
                        Sign up
                    </Link>
                </p>
            </div>
        </>
    );
}
