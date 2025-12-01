import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Share2, Gift, Users, CreditCard, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';

interface ReferralStats {
    total_referrals: number;
    total_credits_earned: number;
    pending_referrals: number;
    completed_referrals: number;
    total_referrals_trend?: string;
    total_credits_earned_trend?: string;
    pending_referrals_trend?: string;
}

interface ReferralCode {
    referral_code: string;
    referral_link: string;
}

export const ReferralPage = () => {
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [codeData, setCodeData] = useState<ReferralCode | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, codeRes] = await Promise.all([
                    axiosInstance.get('/referrals/stats'),
                    axiosInstance.get('/referrals/code')
                ]);
                setStats(statsRes.data);
                setCodeData(codeRes.data);
            } catch (error) {
                console.error('Failed to fetch referral data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied!", {
            description: "Referral link copied to clipboard.",
        });
    };

    const shareReferral = async () => {
        if (navigator.share && codeData) {
            try {
                await navigator.share({
                    title: 'Join ScreenFlow',
                    text: 'Join ScreenFlow and get hired faster! Use my referral code.',
                    url: window.location.origin + codeData.referral_link,
                });
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            copyToClipboard(window.location.origin + (codeData?.referral_link || ''));
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/50 to-purple-800
                p-8 sm:p-12 text-white shadow-2xl shadow-primary-900/20"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div>
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6"
                        >
                            ✨ Refer & Earn Program
                        </motion.span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            Invite Friends, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-pink-200">
                                Earn Unlimited Credits
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-lg leading-relaxed">
                            Share your unique link. When they sign up, you both get 50 bonus credits instantly. No limits on earnings.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="font-semibold text-primary shadow-xl"
                                onClick={() => document.getElementById('referral-link')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Start Referring
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white hover:bg-white/10 hover:text-white"
                            >
                                Read Terms
                            </Button>
                        </div>
                    </div>

                    {/* Illustration Container */}
                    <div className="hidden lg:block h-[400px] w-full relative">
                        <HeroIllustration />
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    icon={Users}
                    label="Total Referrals"
                    value={stats?.total_referrals || 0}
                    delay={0.1}
                    trend={stats?.total_referrals_trend || 0}
                    color="#3b82f6"
                />
                <StatsCard
                    icon={CreditCard}
                    label="Credits Earned"
                    value={stats?.total_credits_earned || 0}
                    delay={0.2}
                    trend={stats?.total_credits_earned_trend || 0}
                    color="#22c55e"
                />
                <StatsCard
                    icon={Gift}
                    label="Pending"
                    value={stats?.pending_referrals || 0}
                    delay={0.3}
                    trend={stats?.pending_referrals_trend || 0}
                    color="#a855f7"
                />
            </div>

            {/* Referral Link Section */}
            <motion.div
                id="referral-link"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="p-8 border-dashed border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="text-center max-w-xl mx-auto">
                        <h2 className="text-2xl font-bold mb-2">Your Unique Referral Link</h2>
                        <p className="text-gray-500 mb-6">Share this link via email, WhatsApp, or social media.</p>

                        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border shadow-sm mb-6">
                            <code className="flex-1 text-lg font-mono text-purple-600 dark:text-purple-400 px-4">
                                {window.location.origin}/auth/signup?ref={codeData?.referral_code}
                            </code>
                            <Button onClick={() => copyToClipboard(`${window.location.origin}/auth/signup?ref=${codeData?.referral_code}`)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                            </Button>
                        </div>

                        <div className="flex justify-center gap-4">
                            <Button variant="outline" className="w-full sm:w-auto" onClick={shareReferral}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share Link
                            </Button>
                            <Button
                                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#128C7E] text-white"
                                onClick={() => window.open(`https://wa.me/?text=Join ScreenFlow using my referral code: ${codeData?.referral_code} ${window.location.origin}/signup?ref=${codeData?.referral_code}`, '_blank')}
                            >
                                WhatsApp
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div >
    );
};

const StatsCard = ({
    icon: Icon,
    label,
    value,
    trend,
    color,
    delay
}: {
    icon: React.ElementType,
    label: string,
    value: string | number,
    trend?: string,
    color: string,
    delay: number
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
    >
        <Card className="p-6 h-full hover:shadow-md transition-shadow duration-300 border dark:border-gray-700">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                    {
                        value ? <h3 className="text-3xl font-bold text-gray-900 tracking-tight dark:text-gray-100">{value}</h3> : <h6>share referal</h6>
                    }
                    {trend && (
                        <div className="flex items-center mt-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {trend}
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
                    <Icon className="w-6 h-6" style={{ color: color }} />
                </div>
            </div>
        </Card>
    </motion.div>
);


const HeroIllustration = () => {
    return (
        <svg viewBox="0 0 400 400" className="w-full h-full opacity-90" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#c4b5fd', stopOpacity: 0.4 }} />
                    <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 0.1 }} />
                </linearGradient>
            </defs>

            {/* Floating Blobs */}
            <motion.circle
                cx="200" cy="200" r="100"
                fill="url(#grad1)"
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 20, 0],
                    y: [0, -20, 0],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.circle
                cx="100" cy="100" r="50"
                fill="#a78bfa"
                fillOpacity="0.3"
                animate={{
                    y: [0, 30, 0],
                    x: [0, 10, 0]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
            />
            <motion.circle
                cx="300" cy="300" r="60"
                fill="#8b5cf6"
                fillOpacity="0.2"
                animate={{
                    y: [0, -40, 0],
                    x: [0, -20, 0]
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                }}
            />

            {/* Connecting Lines */}
            <motion.path
                d="M100 100 L200 200 L300 300"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="10 10"
                fill="none"
                strokeOpacity="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
            />

            {/* User Icons */}
            <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
            >
                <circle cx="200" cy="200" r="15" fill="white" />
                <circle cx="100" cy="100" r="10" fill="white" fillOpacity="0.8" />
                <circle cx="300" cy="300" r="12" fill="white" fillOpacity="0.8" />
            </motion.g>
        </svg>
    )
}