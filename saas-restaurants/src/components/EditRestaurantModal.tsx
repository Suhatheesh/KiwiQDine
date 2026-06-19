import { FC, useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Restaurant, RestaurantRequestResponse } from '../features/restaurants/types';
import { useForm, Controller } from 'react-hook-form';
import { Store, Save } from 'lucide-react';
import { getAllDistricts, getCitiesByDistrict } from '../utils/sriLankaData';
import { PaymentTiming } from '../utils/constants';
import { OperatingHoursInput } from './OperatingHoursInput';
import ImageUploadInput from './ImageUploadInput';
import { isValidEmail, validateNZPhoneNumber } from '../utils';

interface EditRestaurantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: RestaurantRequestResponse) => void;
    restaurant: Restaurant;
    loading?: boolean;
    onImageUpload: (file: File | null) => void
}

export const EditRestaurantModal: FC<EditRestaurantModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    restaurant,
    loading = false,
    onImageUpload
}) => {
    const [district, setDistrict] = useState(restaurant.address?.district || '');
    const [city, setCity] = useState(restaurant.address?.city || '');

    const { register, handleSubmit, setValue, control, watch } = useForm<RestaurantRequestResponse>({
        defaultValues: {
            id: restaurant.id,
            restaurantID: restaurant.id,
            name: restaurant.name,
            contactEmail: restaurant.contactEmail,
            contactPhoneNumber: restaurant.contactPhoneNumber.replace('+94', '0'),
            tenantId: restaurant.tenantId,
            logo: restaurant.logo,
            address: {
                lane: restaurant.address?.lane || '',
                city: restaurant.address?.city || '',
                district: restaurant.address?.district || '',
                country: restaurant.address?.country || 'New Zealand',
            },
            paymentTiming: restaurant.paymentTiming || PaymentTiming.PAY_AT_LAST,
            openTime: restaurant.openTime || "09:00",
            closeTime: restaurant.closeTime || "22:00",
            openHours: restaurant.openHours || null
        },
    });
    const isPhoneNumberValid = validateNZPhoneNumber(watch('contactPhoneNumber'));
    const isEmailValid = isValidEmail(watch('contactEmail'));

    // Get available cities based on selected district
    const availableCities = district ? getCitiesByDistrict(district) : [];

    // Reset city when district changes
    useEffect(() => {
        if (district !== restaurant.address?.district) {
            setCity('');
            setValue('address.city', '');
        }
    }, [district, restaurant.address?.district, setValue]);

    // Update form values when district/city changes
    useEffect(() => {
        setValue('address.district', district);
        setValue('address.city', city);
    }, [district, city, setValue]);

    const handleFormSubmit = (data: RestaurantRequestResponse) => {
        const normalizedData = {
            ...data,
            contactEmail: data.contactEmail?.toLowerCase(),
        };
        onSubmit(normalizedData as RestaurantRequestResponse);
    };

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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Restaurant"
            size="xl"
            footer={
                <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(handleFormSubmit)} isLoading={loading} disabled={!isPhoneNumberValid}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            }
        >
            <form className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                        <Store className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Restaurant Information</h3>
                        <p className="text-sm text-gray-500">Update restaurant details and configuration</p>
                    </div>
                </div>

                {/* Basic Information */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Restaurant Name"
                            placeholder="Enter restaurant name"
                            {...register('name')}
                            required
                        />
                        <Input
                            label="Contact Email"
                            type="email"
                            placeholder="contact@example.com"
                            {...register('contactEmail')}
                            error={watch('contactEmail') && !isEmailValid ? 'Invalid email format' : undefined}
                            required
                        />
                        <Input
                            label="Contact Phone"
                            type="tel"
                            placeholder="XX XXX XXXX"
                            prefix="+94"
                            maxLength={12}
                            onKeyDown={preventMinus}
                            {...register('contactPhoneNumber')}
                            error={watch('contactPhoneNumber')?.length > 9 && !isPhoneNumberValid ? 'Invalid phone number format' : undefined}
                            required
                        />
                        { }
                        <Select
                            label="Payment Timing"
                            options={[
                                { value: PaymentTiming.PAY_AT_LAST, label: 'Pay at Last' },
                                { value: PaymentTiming.PAY_AT_FIRST, label: 'Pay at First' },
                            ]}
                            {...register('paymentTiming')}
                            required
                        />

                        <div className="col-span-2 space-y-4">
                            <ImageUploadInput
                                value={watch('logo') || ''}
                                placeholder="Upload Image"
                                onChange={onImageUpload}
                            />
                        </div>
                    </div>
                </div>

                {/* Address Information */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Address Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                label="Address Lane"
                                placeholder="123 Main Street"
                                {...register('address.lane')}
                                required
                            />
                        </div>
                        <Select
                            label="District"
                            options={[
                                { value: '', label: 'Select District' },
                                ...getAllDistricts().map(d => ({
                                    value: d,
                                    label: d,
                                })),
                            ]}
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            required
                        />
                        <Select
                            label="City"
                            options={[
                                { value: '', label: district ? 'Select City' : 'Select District First' },
                                ...availableCities.map(c => ({
                                    value: c,
                                    label: c,
                                })),
                            ]}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            disabled={!district}
                            required
                        />
                        <Input
                            label="Country"
                            placeholder="New Zealand"
                            {...register('address.country')}
                            defaultValue="New Zealand"
                            required
                        />
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
                </div>
            </form>
        </Modal>
    );
};
