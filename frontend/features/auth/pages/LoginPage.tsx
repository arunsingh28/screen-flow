import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLogin } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatAuthError } from '@/lib/errorUtils';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { mutate: login, isPending, isError, error } = useLogin();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
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
                    Please sign in to your Hyrmate account to manage your candidate pipeline.
                </p>
            </div>

            {/* Error Message Display */}
            {isError && (
                <Alert variant="destructive" className="mb-6">
                    <svg
                        className="h-5 w-5 text-red-600 flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <div className="flex-1">
                        <AlertDescription className="font-medium">
                            {formatAuthError(error)}
                        </AlertDescription>
                    </div>
                </Alert>
            )}

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
                                className="bg-transparent border-slate-200 text-gray-800 dark:text-gray-200"
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
                                <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm font-medium text-blue-600">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-transparent border-slate-200 pr-10 text-gray-800 dark:text-gray-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={isPending || !email || !password}
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
