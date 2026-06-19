import { CheckCircle, ChefHat, Clock, Eye, Flame, History, Package, Play, Shield, ShoppingBag, User, UtensilsCrossed, Wallet, XCircle } from "lucide-react";
import { FC } from "react";
import { OrderLog } from "../../features/orders/types";

interface LogsTabProps {
    orderLogs: OrderLog[];
}

const LogsTab: FC<LogsTabProps> = ({ orderLogs }) => {
    return (
        <div className="flex-1 h-full overflow-y-auto p-6 animate-in fade-in slide-in-from-right-4 duration-300 custom-scrollbar pb-24">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-xl">
                        <History className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Activity Timeline</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Full Audit Trail</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400">{orderLogs?.length || 0} Actions</span>
                </div>
            </div>
            <div className="relative">
                {/* Timeline Vertical Line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100" />

                <div className="space-y-8">
                    {orderLogs && orderLogs.length > 0 ? orderLogs.map((log) => {
                        const logActionMap: Record<string, { label: string, color: string, icon: any, bgColor: string, border: string }> = {
                            'created': { label: 'Order Created', color: 'text-blue-600', icon: ShoppingBag, bgColor: 'bg-blue-50/50', border: 'border-blue-100' },
                            'confirmed': { label: 'Order Confirmed', color: 'text-indigo-600', icon: CheckCircle, bgColor: 'bg-indigo-50/50', border: 'border-indigo-100' },
                            'preparing': { label: 'Started Preparing', color: 'text-orange-600', icon: Flame, bgColor: 'bg-orange-50/50', border: 'border-orange-100' },
                            'ready': { label: 'Ready for Pickup', color: 'text-amber-600', icon: Package, bgColor: 'bg-amber-50/50', border: 'border-amber-100' },
                            'served': { label: 'Order Served', color: 'text-green-600', icon: CheckCircle, bgColor: 'bg-green-50/50', border: 'border-green-100' },
                            'completed': { label: 'Order Completed', color: 'text-emerald-600', icon: CheckCircle, bgColor: 'bg-emerald-50/50', border: 'border-emerald-100' },
                            'cancelled': { label: 'Order Cancelled', color: 'text-red-600', icon: XCircle, bgColor: 'bg-red-50/50', border: 'border-red-100' },
                            'on_hold': { label: 'Order On Hold', color: 'text-amber-600', icon: Clock, bgColor: 'bg-amber-50/50', border: 'border-amber-100' },
                            'released': { label: 'Hold Released', color: 'text-blue-600', icon: Play, bgColor: 'bg-blue-50/50', border: 'border-blue-100' },
                            'payment_processed': { label: 'Payment Received', color: 'text-emerald-600', icon: Wallet, bgColor: 'bg-emerald-50/50', border: 'border-emerald-100' },
                            'viewed': { label: 'Order Viewed', color: 'text-slate-500', icon: Eye, bgColor: 'bg-slate-50/50', border: 'border-slate-100' },
                            'deleted': { label: 'Order Deleted', color: 'text-rose-600', icon: XCircle, bgColor: 'bg-rose-50/50', border: 'border-rose-100' },
                        };

                        const roleMap: Record<string, { icon: any, color: string, label: string }> = {
                            'kitchen_staff': { icon: ChefHat, color: 'text-orange-600', label: 'Kitchen' },
                            'waiter': { icon: UtensilsCrossed, color: 'text-blue-600', label: 'Waiter' },
                            'manager': { icon: Shield, color: 'text-indigo-600', label: 'Manager' },
                            'tenant_admin': { icon: Shield, color: 'text-purple-600', label: 'Admin' },
                            'super_admin': { icon: Shield, color: 'text-rose-600', label: 'Platform Admin' },
                            'customer': { icon: User, color: 'text-gray-600', label: 'Customer' },
                        };

                        const config = logActionMap[log.action] || { label: log.action.replace('_', ' '), color: 'text-slate-600', icon: Clock, bgColor: 'bg-slate-50/50', border: 'border-slate-100' };
                        const roleConfig = roleMap[log.performedByRole] || { icon: User, color: 'text-slate-600', label: log.performedByRole };
                        const Icon = config.icon;
                        const RoleIcon = roleConfig.icon;

                        return (
                            <div key={log.id} className="relative flex gap-8 pl-1 group/item pb-2 last:pb-0">
                                {/* Timeline Node */}
                                <div className={`relative z-10 w-10 h-10 rounded-2xl ${config.bgColor} flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-gray-100 group-hover/item:scale-110 group-hover/item:shadow-md transition-all duration-300`}>
                                    <Icon className={`w-4 h-4 ${config.color}`} />
                                </div>

                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <div className="flex flex-col">
                                            <p className="font-extrabold text-gray-900 group-hover/item:text-primary-600 transition-colors uppercase text-[11px] tracking-widest">
                                                {config.label}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className={`p-1 rounded-md ${roleConfig.color.replace('text-', 'bg-').replace('600', '50')}`}>
                                                    <RoleIcon className={`w-3 h-3 ${roleConfig.color}`} />
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-700 capitalize">
                                                    {log.performedByName}
                                                </span>
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-gray-100 text-gray-400 font-black uppercase tracking-tighter">
                                                    {roleConfig.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="text-[9px] text-gray-400 mt-1">
                                                {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    {log.notes && (
                                        <div className={`p-3 rounded-2xl border ${config.border} ${config.bgColor} bg-opacity-30 group-hover/item:bg-opacity-50 transition-all duration-300 relative overflow-hidden`}>
                                            <div className="absolute top-0 right-0 p-1 opacity-10">
                                                <Icon className="w-12 h-12 -mr-4 -mt-4 rotate-12" />
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed font-medium relative z-10">
                                                {log.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <History className="w-12 h-12 text-gray-200 mb-3" />
                            <p className="text-gray-500 text-sm font-medium">No activity logs recorded yet</p>
                        </div>
                    )}
                </div>
            </div>
            {/* Fade out at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
        </div>
    )
}

export default LogsTab