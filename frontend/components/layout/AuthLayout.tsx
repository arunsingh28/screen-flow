import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
    return (
        <div className="flex min-h-screen w-full bg-white">
            {/* Left Side - Form Area */}
            {/* 
                Mobile: Full width, centered content.
                Desktop: 50% width (lg:w-1/2), comfortable padding.
            */}
            <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:flex-none lg:px-20 xl:px-24 bg-white z-10">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {/* Logo stays constant across auth pages */}
                    <div className="mb-10 flex flex-col items-center lg:items-start">
                        {/* <Logo /> */}
                    </div>

                    {/* The specific form (Login/Register) renders here */}
                    <div className="mt-8">
                        <Outlet />
                    </div>

                    <div className="mt-10 border-t border-slate-200 pt-6">
                        <p className="text-center text-xs text-slate-500">
                            &copy; {new Date().getFullYear()} Hyrmate AI. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Visual/Marketing */}
            <div className="relative hidden w-0 flex-1 lg:block">
                {/* Background Image */}
                <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src="https://picsum.photos/seed/office/1920/1080"
                    alt="Modern office workspace"
                />

                {/* Gradient Overlay for text readability and branding */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/20 mix-blend-multiply" />

                {/* Decorative Pattern (Subtle grid) */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                {/* Testimonial Content */}
                <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col p-12 text-white">
                    <div className="mb-6 h-12 w-12 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-white">
                            <path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9.98305C8.87848 16 7.98305 16.8954 7.98305 18L7.98305 21H5V19C5 17.8954 5.89543 17 7 17H17C18.1046 17 19 17.8954 19 19V21H14.017ZM16.5858 13.5858L12 9L7.41421 13.5858L6 12.1716L12 6.17157L18 12.1716L16.5858 13.5858Z" opacity="0.5" />
                            <path d="M9.983 14H14.017V11H9.983V14Z" fill="white" />
                        </svg>
                    </div>

                    <blockquote className="space-y-6">
                        <p className="text-2xl font-medium leading-relaxed tracking-wide text-slate-100">
                            &ldquo;Hyrmate has revolutionized our hiring process. The AI analysis saves us nearly 20 hours every week, and the quality of candidates we interview has never been higher.&rdquo;
                        </p>
                        <footer className="flex items-center gap-4">
                            <img
                                src="https://picsum.photos/seed/user/100/100"
                                alt="Sofia Davis"
                                className="h-12 w-12 rounded-full border-2 border-white/20 object-cover"
                            />
                            <div className="flex flex-col">
                                <span className="font-semibold text-white">Sofia Davis</span>
                                <span className="text-sm text-slate-300">Head of Talent, QuixHR</span>
                            </div>
                        </footer>
                    </blockquote>
                </div>
            </div>
        </div>
    );
}
