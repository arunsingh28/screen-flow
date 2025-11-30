import React from 'react';

export const TimeGraphIllustration = () => (
    <svg viewBox="0 0 400 200" className="absolute right-0 bottom-0 w-full h-full opacity-20 pointer-events-none text-white overflow-visible">
        <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.8" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
        </defs>
        {/* Abstract Data Line */}
        <path
            d="M0,150 C50,150 50,100 100,100 C150,100 150,40 200,40 C250,40 250,80 300,80 C350,80 350,20 400,20"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="4"
            strokeLinecap="round"
        />
        {/* Area under curve */}
        <path
            d="M0,150 C50,150 50,100 100,100 C150,100 150,40 200,40 C250,40 250,80 300,80 C350,80 350,20 400,20 V200 H0 Z"
            fill="currentColor"
            fillOpacity="0.1"
        />
        {/* Decorative Dots */}
        <circle cx="100" cy="100" r="3" fill="currentColor" />
        <circle cx="200" cy="40" r="4" fill="currentColor" />
        <circle cx="300" cy="80" r="3" fill="currentColor" />
    </svg>
);

export const ClockIllustration = () => (
    <svg viewBox="0 0 100 100" className="absolute -top-6 -right-6 w-48 h-48 opacity-10 text-white pointer-events-none animate-[spin_60s_linear_infinite]">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <path d="M50 50 L50 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M50 50 L70 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);