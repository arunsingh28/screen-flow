import React from 'react';
import { Clock, DollarSign, TrendingUp, Sparkles } from 'lucide-react';
import { TimeGraphIllustration, ClockIllustration } from './Illustrations';

interface ROIWidgetProps {
    totalCVs: number;
}

export const ROIWidget: React.FC<ROIWidgetProps> = ({ totalCVs }) => {
    // Constants for calculation
    const MINUTES_SAVED_PER_CV = 15; // Adjusted for "AI speed vs Human reading"
    const HOURLY_RATE = 5; // Senior Recruiter Rate

    // Calculations
    const totalMinutesSaved = totalCVs * MINUTES_SAVED_PER_CV;
    const hoursSaved = Math.floor(totalMinutesSaved / 60);
    const minutesRemainder = Math.round(totalMinutesSaved % 60);
    const moneySaved = Math.round((totalMinutesSaved / 60) * HOURLY_RATE);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-[#0f172a] text-white shadow-2xl transition-all duration-500 hover:shadow-indigo-500/20 group">

            {/* --- Background Layers --- */}

            {/* 1. Base Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 opacity-90"></div>

            {/* 2. Mesh Gradient Orb */}
            <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-50%] right-[-20%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[80px]"></div>

            {/* 3. SVG Illustrations */}
            <TimeGraphIllustration />
            <ClockIllustration />

            {/* --- Content Content --- */}
            <div className="relative z-10 p-8">

                {/* Header Badge */}
                <div className="flex justify-between items-start mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur-md border border-white/10 shadow-sm">
                        <Sparkles className="h-3 w-3 text-yellow-300" />
                        <span>AI Efficiency Tracker</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 relative">
                    {/* Vertical Divider for desktop */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

                    {/* Metric 1: Time Saved */}
                    <div className="flex flex-col relative group/time">
                        <div className="flex items-center gap-3 text-indigo-200 mb-2">
                            <div className="p-2 rounded-lg bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30">
                                <Clock className="h-5 w-5 text-indigo-300" />
                            </div>
                            <span className="font-medium tracking-wide text-sm uppercase opacity-80">Time Reclaimed</span>
                        </div>

                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-5xl font-bold tracking-tight text-white drop-shadow-sm">
                                {hoursSaved}
                            </span>
                            <div className="flex flex-col ml-2">
                                <span className="text-xl font-medium text-indigo-200">hr</span>
                                <span className="text-sm text-indigo-400">{minutesRemainder > 0 ? `${minutesRemainder} min` : ''}</span>
                            </div>
                        </div>

                        <div className="mt-4 h-1.5 w-full bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-400 to-blue-400 transition-all duration-1000 ease-out rounded-full"
                                style={{ width: `${Math.min(totalCVs * 2, 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-indigo-300/70 mt-2">
                            Based on {totalCVs} CVs analyzed
                        </p>
                    </div>

                    {/* Metric 2: Money Saved */}
                    <div className="flex flex-col relative group/money">
                        <div className="flex items-center gap-3 text-emerald-100 mb-2">
                            <div className="p-2 rounded-lg bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30">
                                <DollarSign className="h-5 w-5 text-emerald-300" />
                            </div>
                            <span className="font-medium tracking-wide text-sm uppercase opacity-80">Cost Savings</span>
                        </div>

                        <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-light text-emerald-200/80 mr-1">$</span>
                            <span className="text-5xl font-bold tracking-tight text-white drop-shadow-sm">
                                {moneySaved.toLocaleString()}
                            </span>
                        </div>

                        <div className="mt-auto pt-4 flex items-center gap-2 text-emerald-300 text-sm font-medium">
                            <TrendingUp className="h-4 w-4" />
                            <span>+${HOURLY_RATE * 5} proj. this week</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};