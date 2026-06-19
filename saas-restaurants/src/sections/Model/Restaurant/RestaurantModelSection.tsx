import { Controller } from "react-hook-form";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import ImageUploadInput from "../../../components/ImageUploadInput";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import { PaymentTiming } from "../../../utils/constants";
import { getAllDistricts, getCitiesByDistrict } from "../../../utils/sriLankaData";
import { OperatingHoursInput } from "../../../components/OperatingHoursInput";
import { SearchableSelect } from "../../../components/SearchableSelect";
import { isValidEmail } from "../../../utils";

interface RestaurantModelSectionProps {
    register: any;
    watch: any;
    control: any;
    handleImageUpload: any;
    filterTenant: any;
    isTenantHasRestaurant?: boolean;
    isPhoneNumberValid?: boolean;
}

const RestaurantModelSection = ({ register, watch, control, handleImageUpload, filterTenant, isTenantHasRestaurant, isPhoneNumberValid }: RestaurantModelSectionProps) => {
    const isEmailValid = isValidEmail(watch('contactEmail'));
    const preventMinus = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            return;
        }
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
            return;
        }
        if (!/^[0-9+]$/.test(e.key)) {
            e.preventDefault();
        }
    };
    return (
        <form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                {isTenantHasRestaurant && (
                    <div className="col-span-2 mb-4 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-4 animate-fadeIn">
                        <div className="bg-orange-100 p-2 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h4 className="text-orange-900 font-bold text-sm">Restaurant Already Exists</h4>
                            <p className="text-orange-700 text-xs mt-0.5">
                                This tenant already has a restaurant associated with it. You cannot create another restaurant for the same tenant.{' '}
                                <Link to="/tenant" className="text-orange-900 font-semibold underline hover:text-orange-800 transition-colors">
                                    Create a new tenant
                                </Link>{' '}
                                instead.
                            </p>
                        </div>
                    </div>
                )}
                <Input
                    label="Restaurant Name"
                    placeholder="Enter restaurant name"
                    {...register('name')}
                />
                <Input
                    label="Email"
                    type="email"
                    placeholder="contact@restaurant.com"
                    {...register('contactEmail')}
                    error={watch('contactEmail') && !isEmailValid ? 'Invalid email format' : undefined}
                />
                <Input
                    label="Phone"
                    type="tel"
                    maxLength={10}
                    placeholder="XXX XXX XXXX"
                    prefix="+64"
                    onKeyDown={preventMinus}
                    {...register('contactPhoneNumber')}
                    error={watch('contactPhoneNumber')?.length > 10 && !isPhoneNumberValid ? 'Invalid phone number format (e.g., 07XXXXXXXX or +947XXXXXXXX)' : undefined}
                />
                <Controller
                    name="tenantId"
                    control={control}
                    render={({ field }) => (
                        <SearchableSelect
                            label="Tenant"
                            options={filterTenant}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Search and select tenant..."
                        />
                    )}
                />
                <div className="col-span-2 space-y-4">
                    <ImageUploadInput
                        value={watch('logo') || ''}
                        placeholder="Upload Image"
                        onChange={handleImageUpload}
                    />
                </div>
                <div className='my-2 col-span-2 text-gray-500 relative font-semibold'>
                    <p> Payment Timing</p>
                    <div className='absolute w-9/12 h-[1px] bg-gray-300 -mt-3 right-14' />
                </div>
                <Select
                    label="Payment Timing"
                    options={[
                        { value: PaymentTiming.PAY_AT_LAST, label: 'Pay at Last' },
                        { value: PaymentTiming.PAY_AT_FIRST, label: 'Pay at First' },
                    ]}
                    {...register('paymentTiming')}
                    required
                />
                <div className='my-2 col-span-2 text-gray-500 relative font-semibold'>
                    <p> Address Section</p>
                    <div className='absolute w-9/12 h-[1px] bg-gray-300 -mt-3 right-14' />
                </div>
                <Input
                    label="Lane"
                    placeholder="123 Main Street"
                    {...register('address.lane')}
                />
                <Input
                    label="Country"
                    placeholder="New Zealand"
                    {...register('address.country')}
                />
                <Select
                    label="District"
                    options={[
                        { value: '', label: 'Select District' },
                        ...getAllDistricts().map(district => ({
                            value: district,
                            label: district,
                        })),
                    ]}
                    value={watch('address.district')}
                    required
                    {...register('address.district')}
                />
                <Select
                    label="City"
                    options={[
                        { value: '', label: watch('address.district') ? 'Select City' : 'Select District First' },
                        ...getCitiesByDistrict(watch('address.district') ?? "").map(city => ({
                            value: city,
                            label: city,
                        })),
                    ]}
                    value={watch('address.city')}
                    disabled={!watch('address.district')}
                    required
                    {...register('address.city')}
                />
                <div className='my-2 col-span-2 text-gray-500 relative font-semibold'>
                    <p>Operating Hours</p>
                    <div className='absolute w-9/12 h-[1px] bg-gray-300 -mt-3 right-14' />
                </div>
                <Input
                    label="Opening Time"
                    type="time"
                    placeholder="09:00"
                    {...register('openTime')}
                />
                <Input
                    label="Closing Time"
                    type="time"
                    placeholder="22:00"
                    {...register('closeTime')}
                />
                <div className='col-span-2'>
                    <Controller
                        name="openHours"
                        control={control}
                        render={({ field }) => (
                            <OperatingHoursInput
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </div>
            </div>
        </form>
    );
};

export default RestaurantModelSection;