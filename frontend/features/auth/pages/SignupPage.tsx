import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSignup } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatAuthError } from '@/lib/errorUtils';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const { mutate: signup, isPending, isError, error } = useSignup();

    const [searchParams] = useSearchParams();
    const referralCode = searchParams.get('ref');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        signup({
            email,
            password,
            company_name: companyName,
            referral_code: referralCode || undefined
        });
    };

    const handleGoogleSignup = () => {
        console.log('Google signup clicked');
    };

    return (
        <>
            <div className="mb-8 flex flex-col items-center lg:items-start text-center lg:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Create an account
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Get started with Hyrmate to revolutionize your hiring process today.
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
                                email
                            </label>
                            <Input
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="words"
                                autoComplete="name"
                                autoCorrect="off"
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
                                htmlFor="password"
                            >
                                password
                            </label>
                            <Input
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                type="password"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
                                htmlFor="companyName"
                            >
                                Company Name
                            </label>
                            <Input
                                id="companyName"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Enter company name"
                                autoComplete="new-password"
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                            />
                            <p className="text-xs text-slate-500">
                                Must be at least 8 characters long.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending || !email || !password || !companyName}
                            className="w-full text-white"
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                "Create account"
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
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 h-10 px-4 py-2 w-full text-slate-700"
                >
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M12.0003 20.45C16.667 20.45 20.5836 16.5333 20.5836 11.8667H12.0003V11.8667H20.5836C20.5836 7.2 16.667 3.28333 12.0003 3.28333C7.33366 3.28333 3.41699 7.2 3.41699 11.8667C3.41699 16.5333 7.33366 20.45 12.0003 20.45Z" fill="currentColor" fillOpacity="0" stroke="currentColor" />
                        <path d="M20.9 10.2H20.4V10H12V14H17.2C16.5 16.1 14.5 17.6 12 17.6C8.9 17.6 6.4 15.1 6.4 12C6.4 8.9 8.9 6.4 12 6.4C13.4 6.4 14.7 6.9 15.7 7.8L18.5 5C16.8 3.4 14.5 2.4 12 2.4C6.7 2.4 2.4 6.7 2.4 12C2.4 17.3 6.7 21.6 12 21.6C17.3 21.6 21.6 17.3 21.6 12C21.6 11.4 21.5 10.8 21.4 10.2H20.9Z" fill="currentColor" />
                    </svg>
                    Google
                </button>

                <p className="px-8 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link to={ROUTES.LOGIN} className="underline underline-offset-4 hover:text-primary-600">
                        Sign in
                    </Link>
                </p>

                <p className="text-center text-xs text-slate-400 px-4">
                    By clicking continue, you agree to our <a href="#" className="underline hover:text-slate-500">Terms of Service</a> and <a href="#" className="underline hover:text-slate-500">Privacy Policy</a>.
                </p>
            </div>
        </>
    );
}
