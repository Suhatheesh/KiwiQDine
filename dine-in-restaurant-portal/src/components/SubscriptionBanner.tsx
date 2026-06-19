import { Sparkles, ArrowRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { useNavigate, useLocation } from 'react-router-dom';
import { RouteLinks } from '../routers/type';
import { Button } from './Button';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../utils/constants';

export const SubscriptionBanner = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const path = useLocation().pathname;
    const { subscriptionUsage } = useSelector((state: RootState) => state.subscription);

    const canUpgrade = user?.role === UserRole.TENANT_ADMIN || user?.role === UserRole.SUPER_ADMIN;

    if (!subscriptionUsage?.recommendations?.shouldUpgrade || path.includes(RouteLinks.SETTINGS)) return null;

    return (
        <div className="sticky top-[70px] mb-4 z-30 bg-linear-to-r from-rose-600 via-red-600 to-orange-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-rose-200/20 flex items-center justify-between gap-6 group overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 border border-white/20">
            {/* Decorative element */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                <Sparkles className="w-24 h-24 text-white" />
            </div>

            <div className="flex items-center gap-4 relative z-10">
                <div className="p-2.5 bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-black uppercase tracking-wider border border-white/20 backdrop-blur-sm">
                            Limit Approaching
                        </span>
                        <h3 className="text-sm font-black text-white tracking-wide">Boost Your Restaurant Experience</h3>
                    </div>
                    <p className="text-xs text-rose-50/90 font-bold line-clamp-1 max-w-xl">
                        {subscriptionUsage.recommendations.reason}
                    </p>
                </div>
            </div>

            {canUpgrade && (
                <div className="flex items-center gap-3 relative z-10 shrink-0">
                    <Button
                        onClick={() => navigate(`${RouteLinks.INVOICES}`)}
                        className="bg-white text-rose-600 hover:bg-white/90 hover:scale-[1.05] active:scale-95 border-none shadow-lg px-6 h-9 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 group/btn"
                    >
                        Upgrade Plan
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}
        </div>
    );
};
