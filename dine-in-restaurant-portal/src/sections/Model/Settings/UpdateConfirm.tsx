import { AlertTriangle, ArrowRight, Building2, MapPin, Wallet, Store, Clock } from "lucide-react";
import { Button } from "../../../components/Button";
import { Restaurant } from "../../../features/restaurants/types";
import { useAuth } from "../../../hooks/useAuth";

interface UpdateConfirmProps {
    restaurant: Restaurant | null;
    restaurantState: Restaurant | null;
    handleCancelUpdate: () => void;
    handleConfirmUpdate: () => void;
}

const UpdateConfirm = ({ restaurant, restaurantState, handleCancelUpdate, handleConfirmUpdate }: UpdateConfirmProps) => {

    const { user } = useAuth();

    return <div className="flex flex-col items-center text-center py-8 px-6">
        <div className="relative mb-8 group">
            <div className="w-24 h-24 bg-linear-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-200 rotate-12 transition-transform duration-500 group-hover:rotate-0">
                <AlertTriangle className="w-12 h-12 text-white -rotate-12 transition-transform duration-500 group-hover:rotate-0" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 bg-amber-400 rounded-3xl opacity-20 animate-ping"></div>
        </div>

        <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
            Review Changes
        </h3>
        <p className="text-gray-500 font-medium mb-8 max-w-sm text-center leading-relaxed">
            Please review the updates below. These changes will be reflected immediately across your restaurant system.
        </p>

        {(() => {
            type Category = 'General' | 'Location' | 'Financial' | 'Operations';
            const changes: Record<Category, { label: string; value: string }[]> = {
                General: [],
                Location: [],
                Financial: [],
                Operations: []
            };

            let hasChanges = false;

            if (restaurant && restaurantState) {
                // General
                if (restaurant.name !== restaurantState.name) changes.General.push({ label: 'Restaurant Name', value: restaurantState.name || '-' });
                if (restaurant.contactEmail !== restaurantState.contactEmail) changes.General.push({ label: 'Support Email', value: restaurantState.contactEmail || '-' });
                if (restaurant.contactPhoneNumber !== restaurantState.contactPhoneNumber) changes.General.push({ label: 'Support Phone', value: restaurantState.contactPhoneNumber || '-' });
                if (restaurant.logo !== restaurantState.logo) changes.General.push({ label: 'Logo', value: restaurantState.logo ? 'Updated' : 'Removed' });
                if (restaurant.banner !== restaurantState.banner) changes.General.push({ label: 'Banner', value: restaurantState.banner ? 'Updated' : 'Removed' });

                // Address
                if (restaurant.address?.lane !== restaurantState.address?.lane) changes.Location.push({ label: 'Address Lane', value: restaurantState.address?.lane || '-' });
                if (restaurant.address?.city !== restaurantState.address?.city) changes.Location.push({ label: 'City', value: restaurantState.address?.city || '-' });
                if (restaurant.address?.district !== restaurantState.address?.district) changes.Location.push({ label: 'District', value: restaurantState.address?.district || '-' });

                // Financial
                if (restaurant.applyServiceCharge !== restaurantState.applyServiceCharge) {
                    changes.Financial.push({ label: 'Service Charge', value: restaurantState.applyServiceCharge ? 'Enabled' : 'Disabled' });
                }
                if (restaurantState.applyServiceCharge) {
                    if (restaurant.serviceChargeType !== restaurantState.serviceChargeType) changes.Financial.push({ label: 'Charge Type', value: restaurantState.serviceChargeType === 'percentage' ? 'Percentage' : 'Fixed Amount' });
                    if (restaurant.serviceChargePercentage !== restaurantState.serviceChargePercentage) changes.Financial.push({ label: 'Charge Percentage', value: `${restaurantState.serviceChargePercentage || 0}%` });
                    if (restaurant.fixedServiceCharge !== restaurantState.fixedServiceCharge) changes.Financial.push({ label: 'Fixed Charge', value: `NZD ${restaurantState.fixedServiceCharge || 0}` });
                }

                // Bank Details
                if (restaurant.bankDetails?.bankName !== restaurantState.bankDetails?.bankName && restaurantState?.bankDetails?.bankName && restaurantState?.bankDetails?.bankName?.trim().length > 0) changes.Financial.push({ label: 'Bank Name', value: restaurantState.bankDetails?.bankName || '-' });
                if (restaurant.bankDetails?.accountNumber !== restaurantState.bankDetails?.accountNumber && restaurantState?.bankDetails?.accountNumber && restaurantState?.bankDetails?.accountNumber?.trim().length > 0) changes.Financial.push({ label: 'Account Number', value: restaurantState.bankDetails?.accountNumber || '-' });

                // Waiter Confirmation
                if ((user?.restaurant?.requireWaiterConfirmation || false) !== restaurantState.requireWaiterConfirmation) {
                    changes.Operations.push({ label: 'Waiter Confirmation', value: restaurantState.requireWaiterConfirmation ? 'Enabled' : 'Disabled' });
                }

                // Hours (Simplified check)
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                let hoursChanged = false;
                days.forEach(day => {
                    const oldDay = restaurant.openHours?.[day];
                    const newDay = restaurantState.openHours?.[day];
                    if (oldDay && newDay) {
                        if (oldDay.closed !== newDay.closed || oldDay.open !== newDay.open || oldDay.close !== newDay.close) {
                            hoursChanged = true;
                        }
                    }
                });
                if (hoursChanged) {
                    changes.Operations.push({ label: 'Opening Hours', value: 'Schedule Updated' });
                }

                // Check if any category has changes
                hasChanges = Object.values(changes).some(cat => cat.length > 0);
            }

            const getCategoryIcon = (cat: Category) => {
                switch (cat) {
                    case 'General': return <Building2 className="w-3.5 h-3.5" />;
                    case 'Location': return <MapPin className="w-3.5 h-3.5" />;
                    case 'Financial': return <Wallet className="w-3.5 h-3.5" />;
                    case 'Operations': return <Clock className="w-3.5 h-3.5" />; // Or Store icon
                    default: return <Store className="w-3.5 h-3.5" />;
                }
            }

            return (
                <div className="w-full mb-8">
                    {!hasChanges ? (
                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col items-center justify-center">
                            <span className="text-gray-400 font-medium">No changes detected</span>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs ring-1 ring-black/5">
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {(Object.entries(changes) as [Category, { label: string; value: string }[]][]).map(([category, items]) => {
                                    if (items.length === 0) return null;
                                    return (
                                        <div key={category} className="border-b border-gray-100 last:border-0">
                                            <div className="bg-gray-50/80 px-5 py-2 flex items-center gap-2 border-b border-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
                                                <span className={`p-1 rounded-md ${category === 'Financial' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                                                    {getCategoryIcon(category)}
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{category}</span>
                                            </div>
                                            <div className="p-2 space-y-1">
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                                                        <span className="text-sm font-medium text-gray-500 group-hover:text-gray-900 transition-colors">{item.label}</span>
                                                        <span className="font-bold text-gray-900 text-sm">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            );
        })()}

        <div className="flex gap-4 w-full">
            <Button
                variant="ghost"
                onClick={handleCancelUpdate}
                className="flex-1 rounded-2xl py-5 border-2 border-gray-100 font-black text-gray-400 uppercase tracking-widest text-xs hover:bg-gray-50 active:scale-95 transition-all"
            >
                Cancel
            </Button>
            <Button
                onClick={handleConfirmUpdate}
                disabled={!!(restaurant && restaurantState && JSON.stringify(restaurant) === JSON.stringify(restaurantState))}
                className="flex-1 rounded-2xl py-5 bg-linear-to-r from-emerald-500 to-teal-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-100 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <span>Confirm Update</span>
                <ArrowRight className="w-4 h-4" />
            </Button>
        </div>
    </div>
}

export default UpdateConfirm;
