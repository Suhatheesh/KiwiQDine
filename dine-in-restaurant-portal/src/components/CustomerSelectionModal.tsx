import { FC, useLayoutEffect, useState } from 'react';
import { X, Phone, User, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { Customer } from '../features/orders/types';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../app/store';
import { fetchCustomersByNumberRequest, insertCustomerRequest, resetCustomers } from '../features/customers/customerSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { useAuth } from '../hooks/useAuth';
import { hexToRgba } from '../utils';

interface CustomerSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPhoneSubmit: (phoneNumber: string, customerName: string) => void;
}

type Step = 'phone-entry' | 'customer-display';

export const CustomerSelectionModal: FC<CustomerSelectionModalProps> = ({
    isOpen,
    onClose,
    onPhoneSubmit
}) => {

    const dispatch = useDispatch<AppDispatch>();
    const { customers, loading, error } = useSelector((state: RootState) => state.customer);
    const { primaryColor } = useAuth();

    const [step, setStep] = useState<Step>('phone-entry');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);


    useLayoutEffect(() => {
        if (!customers) return;
        if (customers.length > 0) {
            const customer = customers[0];
            setExistingCustomer(customer);
            setCustomerName(customer.name || '');
            setStep('customer-display');
        } else {
            setExistingCustomer(null);
            setCustomerName('');
            setStep('customer-display');
        }
    }, [customers]);


    if (!isOpen) return null;

    const handleCheckCustomer = async () => {
        if (phoneNumber.length !== 10) return;
        dispatch(fetchCustomersByNumberRequest(phoneNumber));
    };

    const handleSubmit = () => {
        const finalName = existingCustomer?.name || customerName;
        if (phoneNumber.trim().length === 10 && finalName.trim().length > 0) {
            dispatch(insertCustomerRequest({ customerName: finalName, phone: phoneNumber }));
            dispatch(resetCustomers())
            onPhoneSubmit(phoneNumber, finalName);
            handleClose();
        }
    };

    const handleClose = () => {
        setStep('phone-entry');
        setPhoneNumber('');
        setCustomerName('');
        setExistingCustomer(null);
        onClose();
    };

    const handlePhoneChange = (value: string) => {
        // Only allow numbers
        const cleaned = value.replace(/\D/g, '');
        setPhoneNumber(cleaned);
    };

    const handleBack = () => {
        setStep('phone-entry');
        setExistingCustomer(null);
        setCustomerName('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-slideUp">
                {/* Gradient Header */}
                <div style={{ background: `linear-gradient(to right, ${hexToRgba(primaryColor, 0.8)}, ${hexToRgba(primaryColor, 0.9)})` }} className="p-6 relative">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Customer Details</h2>
                            <p className="text-blue-100 text-sm mt-1">
                                {step === 'phone-entry' ? 'Enter phone number' : existingCustomer ? 'Customer found' : 'New customer'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {step === 'phone-entry' ? (
                        /* Step 1: Phone Number Entry */
                        <>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                        placeholder="0771234567"
                                        maxLength={10}
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        autoFocus
                                        onKeyPress={(e) => e.key === 'Enter' && phoneNumber.length === 10 && handleCheckCustomer()}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Enter 10-digit mobile number</p>

                                {/* Validation message */}
                                {phoneNumber.length > 0 && phoneNumber.length < 10 && (
                                    <p className="text-xs text-red-500 flex items-center space-x-1">
                                        <span>⚠️</span>
                                        <span>Please enter a valid 10-digit phone number</span>
                                    </p>
                                )}

                                {phoneNumber.length === 10 && (
                                    <p className="text-xs text-green-600 flex items-center space-x-1">
                                        <span>✓</span>
                                        <span>Ready to check customer</span>
                                    </p>
                                )}

                                {error && (
                                    <p className="text-xs text-red-500 flex items-center space-x-1">
                                        <span>⚠️</span>
                                        <span>{error}</span>
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-2">
                                <Button
                                    variant="ghost"
                                    onClick={handleClose}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCheckCustomer}
                                    disabled={phoneNumber.length !== 10}
                                    isLoading={loading}
                                    className="flex-1 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Check Customer
                                </Button>
                            </div>
                        </>
                    ) : (
                        /* Step 2: Customer Display or Name Entry */
                        <>
                            {/* Phone Number Display */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        disabled
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl text-gray-600"
                                    />
                                </div>
                            </div>

                            {existingCustomer ? (
                                /* Existing Customer Display */
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Customer Name
                                    </label>
                                    <div className="relative">
                                        <div className="flex items-center space-x-3 p-4 border-2 border-green-200 bg-green-50 rounded-xl">
                                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{existingCustomer.name}</p>
                                                <p className="text-xs text-gray-500">Existing customer</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* New Customer Name Input */
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Customer Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Enter customer name"
                                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            autoFocus
                                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                                        />
                                    </div>
                                    <p className="text-xs text-blue-500 flex items-center space-x-1">
                                        <span>ℹ️</span>
                                        <span>New customer - please enter name</span>
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-2">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!existingCustomer && customerName.trim().length === 0}
                                    className="flex-1 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
