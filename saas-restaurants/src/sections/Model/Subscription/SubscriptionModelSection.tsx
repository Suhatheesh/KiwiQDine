import { Plus, Shield, Star, Trash2, Zap, Layers, TrendingUp } from "lucide-react";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import { BillingCycle } from "../../../utils/constants";
import { Button } from "../../../components/Button";
import { CreateSubscriptionPlan } from "../../../features/subscriptions/types";
import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { MultiSelect } from "../../../components/MultiSelect";
import { TenantMinimalList } from "../../../features/tenants/types";
import { useLayoutEffect } from "react";

interface SubscriptionModelSectionProps {
    register: UseFormRegister<CreateSubscriptionPlan>;
    featureInput: { id: number, value: string }[];
    addFeature: any;
    removeFeature: any;
    generateFeatureInput: any;
    tenants: TenantMinimalList[];
    watch: UseFormWatch<CreateSubscriptionPlan>;
    setValue: UseFormSetValue<CreateSubscriptionPlan>;
    onSearchTenant?: (searchTerm: string) => void;
}

const SubscriptionModelSection = ({ register, featureInput, addFeature, removeFeature, generateFeatureInput, tenants, watch, setValue, onSearchTenant }: SubscriptionModelSectionProps) => {
    const isSpecializedPlan = watch('isSpecializedPlan');
    const selectedTenantIds = watch('tenantIds') || [];

    const tenantOptions = tenants.map(t => ({
        value: t.id,
        label: t.tenantName
    }));

    const handleTenantChange = (ids: string[]) => {
        setValue('tenantIds', ids);
    };

    useLayoutEffect(() => {
        if (!isSpecializedPlan) {
            setValue('tenantIds', [])
        }
    }, [isSpecializedPlan])

    return (
        <form className="space-y-8">
            {/* Section 1: Plan Details */}
            <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Plan Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Plan Name"
                        type="text"
                        placeholder="Enter plan name..."
                        {...register('name')}
                        className="bg-white"
                    />
                    <Input
                        label="Description"
                        type="text"
                        placeholder="Brief description of what this plan offers..."
                        {...register('description')}
                        className="bg-white"
                    />
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex flex-col gap-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:border-blue-600 checked:bg-blue-600 transition-all"
                                    checked={!isSpecializedPlan}
                                    onChange={(e) => setValue('isSpecializedPlan', !e.target.checked)}
                                />
                                <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-white opacity-0 peer-checked:opacity-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                            </div>
                            <span className="text-sm font-medium text-gray-700 select-none">Available for All Tenants</span>
                        </label>

                        {isSpecializedPlan && (
                            <div className="animate-fadeIn">
                                <MultiSelect
                                    label="Select Specific Tenants"
                                    placeholder="Select one or more tenants..."
                                    options={tenantOptions}
                                    value={selectedTenantIds}
                                    onChange={handleTenantChange}
                                    onSearch={onSearchTenant}
                                />
                                <p className="mt-1.5 text-xs text-gray-500 italic">
                                    This plan will only be visible and available to the selected tenants.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 2: Pricing & Billing */}
            <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <Zap className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Pricing & Billing</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Billing Cycle"
                        options={[
                            { value: BillingCycle.MONTHLY, label: 'Monthly Billing' },
                            { value: BillingCycle.YEARLY, label: 'Yearly Billing' },
                        ]}
                        {...register('billingCycle')}
                        className="bg-white"
                    />
                    <div className="relative">
                        <Input
                            label="Monthly Price"
                            type="number"
                            placeholder="0.00"
                            {...register('priceMonthly')}
                            className="bg-white pl-12"
                        />
                        <span className="absolute left-3 top-[33px] text-gray-400">NZD</span>
                    </div>
                    <div className="relative items-center">
                        <Input
                            label="Yearly Price"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...register('priceYearly')}
                            className="bg-white pl-12"
                        />
                        <span className="absolute left-3 top-[33px] text-gray-400">USD</span>
                    </div>
                    <Input
                        label="Yearly Savings (%)"
                        type="number"
                        placeholder="0"
                        {...register('yearlySavingsPercent')}
                        className="bg-white"
                    />
                </div>
            </div>

            {/* Section 3: Usage Limits */}
            <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <Layers className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Usage Limits</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input
                        label="Order Limit"
                        type="number"
                        placeholder="0"
                        {...register('orderLimit')}
                        className="bg-white"
                    />
                    <Input
                        label="QR Limit"
                        type="number"
                        placeholder="0"
                        {...register('qrLimit')}
                        className="bg-white"
                    />
                    <Input
                        label="User Limit"
                        type="number"
                        placeholder="0"
                        {...register('userLimit')}
                        className="bg-white"
                    />
                    <Input
                        label="Table Limit"
                        type="number"
                        placeholder="0"
                        {...register('tableLimit')}
                        className="bg-white"
                    />
                </div>
            </div>

            {/* Section 4: Overage Charges */}
            <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Overage Charges</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                        <Input
                            label="Per Invoice Overage"
                            type="number"
                            placeholder="0.00"
                            {...register('overageChargePerInvoice')}
                            className="bg-white pl-12"
                        />
                        <span className="absolute left-3 top-[33px] text-gray-400">USD</span>
                    </div>
                    <div className="relative">
                        <Input
                            label="Per User Overage"
                            type="number"
                            placeholder="0.00"
                            {...register('overageChargePerUser')}
                            className="bg-white pl-12"
                        />
                        <span className="absolute left-3 top-[33px] text-gray-400">USD</span>
                    </div>
                    <div className="relative">
                        <Input
                            label="Per QR Overage"
                            type="number"
                            placeholder="0.00"
                            {...register('overageChargePerQR')}
                            className="bg-white pl-12"
                        />
                        <span className="absolute left-3 top-[33px] text-gray-400">USD</span>
                    </div>
                    <div className="relative">
                        <Input
                            label="Per Table Overage"
                            type="number"
                            placeholder="0.00"
                            {...register('overageChargePerTable')}
                            className="bg-white pl-12"
                        />
                        <span className="absolute left-3 top-[33px] text-gray-400">USD</span>
                    </div>
                </div>
            </div>

            {/* Section 5: Plan Features */}
            <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Star className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Plan Features</h3>
                    </div>
                    <Button type="button" onClick={generateFeatureInput} size="sm" variant="ghost" className="text-xs border border-gray-200 hover:border-gray-300 hover:bg-gray-50">
                        <Plus className="w-3 h-3 mr-1" /> Add Feature
                    </Button>
                </div>

                <div className="space-y-3">
                    {featureInput.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-3 group">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-medium">
                                {index + 1}
                            </div>
                            <div className="flex-grow">
                                <Input
                                    placeholder="e.g. Unlimited Tables"
                                    value={item.value}
                                    onChange={(e) => addFeature(item.id, e.target.value)}
                                    className="bg-white mb-0"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFeature(index)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {featureInput.length === 0 && (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                            No features added yet. Click "Add Feature" to start.
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};

export default SubscriptionModelSection;
