import { Archive, Calendar, Check, Edit, RefreshCcw, Sparkles, History, Shield, Star, Zap, Trash2 } from "lucide-react"
import { SubscriptionPlan } from "../features/subscriptions/types";
import { SubscriptionPlanType } from "../utils/constants";
import { dateFormatter } from "../utils";

interface SubscriptionCardProps {
    plan: SubscriptionPlan;
    isPopular?: boolean;
    isArchived?: boolean;
    stats: {
        count: number;
        revenue: number;
    };
    handleArchive?: (planId: string, planName: string) => void;
    handleUnarchive?: (planId: string, planName: string) => void;
    handleEdit?: (plan: SubscriptionPlan) => void;
    handleDelete?: (planId: string, planName: string) => void;
}

const SubscriptionCard = ({ plan, isPopular, isArchived, stats, handleArchive, handleUnarchive, handleEdit, handleDelete }: SubscriptionCardProps) => {

    const getPlanIcon = (code: string) => {
        switch (code) {
            case SubscriptionPlanType.DINE_SOON_LITE: return <Shield className="w-6 h-6 text-blue-500" />;
            case SubscriptionPlanType.DINE_SOON_PRO: return <Zap className="w-6 h-6 text-yellow-500" />;
            case SubscriptionPlanType.DINE_SOON_PREMIUM: return <Star className="w-6 h-6 text-purple-500" />;
            default: return <Sparkles className="w-6 h-6 text-gray-500" />;
        }
    };

    const getGradient = (code: string) => {
        switch (code) {
            case SubscriptionPlanType.DINE_SOON_LITE: return "from-blue-50 to-white";
            case SubscriptionPlanType.DINE_SOON_PRO: return "from-yellow-50 to-white";
            case SubscriptionPlanType.DINE_SOON_PREMIUM: return "from-purple-50 to-white";
            default: return "from-gray-50 to-white";
        }
    };

    return (
        <div
            key={plan.id}
            className={`group relative flex-1 flex flex-col bg-white rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border ${isPopular && !isArchived ? 'border-blue-200 shadow-blue-100' : 'border-gray-100 shadow-sm'
                } ${isArchived ? 'opacity-90 grayscale-[0.2]' : ''}`}
        >
            {isPopular && !isArchived && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        MOST POPULAR
                    </span>
                </div>
            )}

            {isArchived && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-gray-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                        <Archive className="w-3 h-3" />
                        ARCHIVED
                    </span>
                </div>
            )}

            {/* Card Header */}
            <div className={`p-6 rounded-t-2xl bg-gradient-to-b ${getGradient(plan.code || "")}`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                        {getPlanIcon(plan.code || "")}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        {isArchived ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleUnarchive && handleUnarchive(plan.id!, plan.name)}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-white rounded-lg transition-all shadow-sm"
                                    title="Unarchive Plan"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete && handleDelete(plan.id!, plan.name)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-sm"
                                    title="Delete Plan"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ) : plan.code !== SubscriptionPlanType.TRIAL ? (
                            <>
                                <button
                                    onClick={() => handleArchive && handleArchive(plan.id!, plan.name)}
                                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-white rounded-lg transition-all shadow-sm"
                                    title="Archive Plan"
                                >
                                    <Archive className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleEdit && handleEdit(plan)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm"
                                    title="Edit Plan"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <></>
                        )}
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 h-10">{plan.description}</p>

                {/* Specialized Plan Tenant Names */}
                {plan.isSpecializedPlan && plan.tenantNames && plan.tenantNames.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {plan.tenantNames.map((tenantName, index) => (
                            <span
                                key={index}
                                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-100 uppercase tracking-wider"
                            >
                                {tenantName}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Price Section */}
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        NZD {plan.priceMonthly}
                    </span>
                    <span className="text-gray-500 font-medium">/mo</span>
                </div>
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                    Save {Math.round(((plan.priceMonthly * 12 - (plan.priceYearly ?? 0)) / (plan.priceMonthly * 12)) * 100)}% yearly
                </div>
            </div>

            {/* Features List */}
            <div className="flex flex-col flex-1 p-6">
                <div className="flex flex-col flex-1 space-y-4 mb-8">
                    {plan.features.slice(0, 5).map((feature: any, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-600 leading-tight">{feature}</span>
                        </div>
                    ))}
                    {plan.features.length > 5 && (
                        <div className="text-xs text-center text-gray-400 font-medium">
                            +{plan.features.length - 5} more features
                        </div>
                    )}
                </div>

                {/* Stats Footer */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Active</div>
                        <div className="text-lg font-bold text-gray-900">{stats.count}</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">MRR</div>
                        <div className="text-lg font-bold text-gray-900">
                            NZD {stats.revenue.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Dates Section */}
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-3 group/date transition-all duration-300">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover/date:bg-blue-100 transition-colors">
                            <Calendar className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Created</span>
                            <span className="text-xs text-gray-600 font-bold whitespace-nowrap">
                                {plan.createdAt ? dateFormatter.format(new Date(plan.createdAt)) : '-'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 group/date transition-all duration-300">
                        <div className="p-2 bg-emerald-50 rounded-lg group-hover/date:bg-emerald-100 transition-colors">
                            <History className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Last Update</span>
                            <span className="text-xs text-gray-600 font-bold whitespace-nowrap">
                                {plan.updatedAt ? dateFormatter.format(new Date(plan.updatedAt)) : '-'}
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default SubscriptionCard
