import { Sparkles, ArrowRight, Star, Zap, Shield } from 'lucide-react';
import { Button } from '../../../components/Button';

interface SuccessShowcaseSectionProps {
    plan: {
        name: string;
        code: string;
        features: string[];
    };
    onClose: () => void;
}

export const SuccessShowcaseSection = ({ plan, onClose }: SuccessShowcaseSectionProps) => {
    const isPremium = plan.code.toLowerCase().includes('premium');
    const isPro = plan.code.toLowerCase().includes('pro');

    const getGradient = () => {
        if (isPremium) return 'from-purple-600 to-indigo-600';
        if (isPro) return 'from-blue-600 to-cyan-600';
        return 'from-emerald-600 to-teal-600';
    };

    const getIcon = () => {
        if (isPremium) return Star;
        if (isPro) return Zap;
        return Shield;
    };

    const MainIcon = getIcon();

    return (
        <div className="py-2 overflow-hidden selection:bg-blue-100">
            <div className="space-y-10 animate-in fade-in zoom-in duration-1000 cubic-bezier(0.23, 1, 0.32, 1)">
                {/* Animated Header Section */}
                <div className="text-center space-y-4 relative px-4">
                    <div className={`absolute inset-0 bg-linear-to-r ${getGradient()} opacity-5 blur-3xl rounded-full -z-10 animate-pulse`}></div>

                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-linear-to-r ${getGradient()} blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse`}></div>
                            <div className={`relative w-20 h-20 rounded-3xl bg-linear-to-br ${getGradient()} flex items-center justify-center shadow-2xl transform group-hover:rotate-12 transition-transform duration-500`}>
                                <MainIcon className="w-10 h-10 text-white animate-bounce" />
                            </div>
                            <div className="absolute -top-3 -right-3">
                                <div className="bg-white p-2 rounded-xl shadow-lg animate-bounce delay-100">
                                    <Sparkles className="w-4 h-4 text-yellow-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-linear-to-r ${getGradient()} text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 animate-in slide-in-from-top-4 duration-700`}>
                            <Sparkles className="w-3 h-3" />
                            Excellence Unlocked
                        </div>

                        <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none pt-2">
                            Welcome to <span className={`text-transparent bg-clip-text bg-linear-to-r ${getGradient()} drop-shadow-sm`}>{plan.name}</span>
                        </h2>

                        <p className="text-gray-500 max-w-sm mx-auto font-semibold text-base leading-relaxed opacity-80">
                            Your restaurant's professional era begins now. Get ready to scale like never before.
                        </p>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 px-2 pb-2">
                    <Button
                        onClick={onClose}
                        className={`w-full py-6 rounded-3xl text-white font-black text-xl flex items-center justify-center gap-4 group overflow-hidden relative`}
                    >
                        <span className="relative z-10">Start Your Journey</span>
                        <ArrowRight className="w-7 h-7 group-hover:translate-x-3 transition-transform relative z-10" strokeWidth={3} />
                    </Button>

                    <p className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-6 animate-pulse">
                        Locked & Loaded • Advanced Performance Enabled
                    </p>
                </div>
            </div>
        </div>
    );
};
