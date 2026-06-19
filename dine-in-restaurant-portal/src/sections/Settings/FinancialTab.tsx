import { DollarSign, Store } from "lucide-react";
import { IOSSwitch } from "../../components/Switch";
import { Select } from "../../components/Select";
import { Input } from "../../components/Input";

interface FinancialTabProps {
    primaryColor: string;
    restaurantState: any;
    setRestaurantState: any;
}

const FinancialTab = ({ primaryColor, restaurantState, setRestaurantState }: FinancialTabProps) => {
    return <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-50 rounded-2xl shadow-sm">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Tax & Service Charges</h2>
                    <p className="text-sm text-gray-400 font-medium">Manage extra charges applied to orders</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gray-50/80 rounded-3xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Service Charge</h3>
                            <p className="text-xs text-gray-500 font-medium">Apply a service fee to all customer orders automatically.</p>
                        </div>
                    </div>
                    <IOSSwitch
                        primaryColor={primaryColor}
                        checked={restaurantState?.applyServiceCharge ?? false}
                        onChange={(e) => setRestaurantState({ ...restaurantState, applyServiceCharge: e.target.checked })}
                    />
                </div>

                {restaurantState?.applyServiceCharge && (
                    <div className="p-8 bg-blue-50/30 rounded-3xl border-2 border-dashed border-blue-100 animate-in fade-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Select
                                label="Charge Type"
                                options={[
                                    { value: 'percentage', label: 'Percentage (%)' },
                                    { value: 'fixed', label: 'Fixed Amount (NZD)' },
                                ]}
                                value={restaurantState?.serviceChargeType}
                                onChange={(e) => setRestaurantState({ ...restaurantState, serviceChargeType: e.target.value as any })}
                            />

                            {restaurantState.serviceChargeType === 'percentage' ? (
                                <Input
                                    label="Percentage (%)"
                                    type="number"
                                    value={restaurantState?.serviceChargePercentage ?? ""}
                                    onChange={(e) => setRestaurantState({ ...restaurantState, serviceChargePercentage: Number(e.target.value) })}
                                    placeholder="e.g. 10"
                                />
                            ) : (
                                <Input
                                    label="Fixed Amount (NZD)"
                                    type="number"
                                    value={restaurantState?.fixedServiceCharge ?? ""}
                                    onChange={(e) => setRestaurantState({ ...restaurantState, fixedServiceCharge: Number(e.target.value) })}
                                    placeholder="e.g. 200"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-50 rounded-2xl shadow-sm">
                    <Store className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Banking Details</h2>
                    <p className="text-sm text-gray-400 font-medium">Used for settlements and payouts</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                <Input
                    label="Bank Name"
                    placeholder="e.g. Commercial Bank"
                    value={restaurantState?.bankDetails?.bankName ?? ""}
                    onChange={(e) => setRestaurantState({ ...restaurantState, bankDetails: { ...restaurantState?.bankDetails, bankName: e.target.value } } as any)}
                />
                <Input
                    label="Account Holder Name"
                    placeholder="e.g. John Doe Enterprises"
                    value={restaurantState?.bankDetails?.accountName ?? ""}
                    onChange={(e) => setRestaurantState({ ...restaurantState, bankDetails: { ...restaurantState?.bankDetails, accountName: e.target.value } } as any)}
                />
                <Input
                    label="Account Number"
                    placeholder="000123456789"
                    value={restaurantState?.bankDetails?.accountNumber ?? ""}
                    onChange={(e) => setRestaurantState({ ...restaurantState, bankDetails: { ...restaurantState?.bankDetails, accountNumber: e.target.value } } as any)}
                />
                <Input
                    label="Branch"
                    placeholder="e.g. Colombo Fort"
                    value={restaurantState?.bankDetails?.branch ?? ""}
                    onChange={(e) => setRestaurantState({ ...restaurantState, bankDetails: { ...restaurantState?.bankDetails, branch: e.target.value } } as any)}
                />
                <Input
                    label="IBAN (Optional)"
                    placeholder="LK12345678..."
                    value={restaurantState?.bankDetails?.iban ?? ""}
                    onChange={(e) => setRestaurantState({ ...restaurantState, bankDetails: { ...restaurantState?.bankDetails, iban: e.target.value } } as any)}
                />
                <Input
                    label="SWIFT / BIC (Optional)"
                    placeholder="COMBOLKXXX"
                    value={restaurantState?.bankDetails?.swiftCode ?? ""}
                    onChange={(e) => setRestaurantState({ ...restaurantState, bankDetails: { ...restaurantState?.bankDetails, swiftCode: e.target.value } } as any)}
                />
            </div>
        </div>
    </div>
}

export default FinancialTab;