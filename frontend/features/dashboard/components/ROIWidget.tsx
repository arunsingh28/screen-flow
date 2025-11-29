import React from 'react';
import { Clock, DollarSign, TrendingUp } from 'lucide-react';

interface ROIWidgetProps {
    totalCVs: number;
}

export const ROIWidget: React.FC<ROIWidgetProps> = ({ totalCVs }) => {
    // Constants for calculation
    const MINUTES_SAVED_PER_CV = 7;
    const HOURLY_RATE = 40; // $40/hr

    // Calculations
    const totalMinutesSaved = totalCVs * MINUTES_SAVED_PER_CV;
    const hoursSaved = Math.floor(totalMinutesSaved / 60);
    const moneySaved = Math.round((totalMinutesSaved / 60) * HOURLY_RATE);

    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-black/10 blur-2xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                {/* Main Value: Time Saved */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-indigo-100 mb-1">
                        <Clock className="h-5 w-5" />
                        <span className="font-medium">Time Saved</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-bold tracking-tight">
                            {hoursSaved} <span className="text-2xl font-semibold text-indigo-200">Hours</span>
                        </h2>
                    </div>
                    <p className="text-sm text-indigo-200 mt-2 max-w-md">
                        You've saved ~{hoursSaved} hours of manual screening time by using AI automation this month.
                    </p>
                </div>

                {/* Divider (Desktop) */}
                <div className="hidden md:block w-px h-16 bg-white/20"></div>

                {/* Secondary Value: Money Saved */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-indigo-100 mb-1">
                        <DollarSign className="h-5 w-5" />
                        <span className="font-medium">Estimated Savings</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-bold tracking-tight">
                            ${moneySaved.toLocaleString()}
                        </h2>
                    </div>
                    <p className="text-sm text-indigo-200 mt-2">
                        Based on an average recruiter rate of ${HOURLY_RATE}/hr.
                    </p>
                </div>

                {/* Call to Action / Badge */}
                <div className="hidden lg:flex flex-col items-end justify-center">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                        <TrendingUp className="h-4 w-4 text-green-300" />
                        <span className="font-medium text-sm">High Efficiency</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
