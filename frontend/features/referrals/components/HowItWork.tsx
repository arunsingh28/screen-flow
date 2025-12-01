import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Sparkles, Coins } from 'lucide-react';

const steps = [
    {
        icon: UserPlus,
        title: "Send Invitation",
        description: "Share your unique link with friends or colleagues via email or social media."
    },
    {
        icon: Sparkles,
        title: "They Join",
        description: "Your friends sign up for ScreenFlow using your link and verify their account."
    },
    {
        icon: Coins,
        title: "You Earn Credits",
        description: "You instantly receive 50 credits, and your friend gets a 20% discount."
    }
];

export const HowItWorks = () => {
    return (
        <div className="py-12">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-10">How it works</h3>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-4 relative">
                {/* Connecting Line for Desktop */}
                <div className="hidden md:block absolute top-12 left-20 right-20 h-0.5 bg-gray-200 -z-10" />

                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2 }}
                        className="flex-1 max-w-sm text-center bg-white md:bg-transparent p-6 md:p-0 rounded-xl shadow-sm md:shadow-none border md:border-none border-gray-100"
                    >
                        <div className="w-24 h-24 mx-auto bg-white rounded-full border-4 border-gray-50 shadow-lg flex items-center justify-center mb-6 relative">
                            <div className="absolute inset-0 bg-primary-50 rounded-full scale-90" />
                            <step.icon className="w-10 h-10 text-primary-600 relative z-10" />
                            <div className="absolute -right-2 -top-2 w-8 h-8 bg-primary-600 rounded-full text-white flex items-center justify-center font-bold text-sm border-4 border-white">
                                {index + 1}
                            </div>
                        </div>
                        <h4 className="text-lg font-semibold mb-2 text-gray-900">{step.title}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                            {step.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};