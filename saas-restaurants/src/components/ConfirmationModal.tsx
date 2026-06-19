import { AlertCircle, HelpCircle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'warning' | 'success';
    isLoading?: boolean;
}

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    isLoading = false
}: ConfirmationModalProps) => {
    if (!isOpen) return null;

    const config = {
        danger: {
            icon: <AlertCircle className="w-8 h-8 text-red-500" />,
            iconBg: 'bg-red-50',
            buttonBg: 'bg-red-600 hover:bg-red-700 shadow-red-500/20',
            accent: 'red'
        },
        info: {
            icon: <HelpCircle className="w-8 h-8 text-blue-500" />,
            iconBg: 'bg-blue-50',
            buttonBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
            accent: 'blue'
        },
        warning: {
            icon: <AlertCircle className="w-8 h-8 text-amber-500" />,
            iconBg: 'bg-amber-50',
            buttonBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20',
            accent: 'amber'
        },
        success: {
            icon: <HelpCircle className="w-8 h-8 text-emerald-500" />,
            iconBg: 'bg-emerald-50',
            buttonBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
            accent: 'emerald'
        }
    };

    const current = config[type];

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
                {/* Backdrop with blur */}
                <div
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity animate-fadeIn"
                    onClick={onClose}
                />

                {/* Modal Container */}
                <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-2xl transition-all animate-scaleIn">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        {/* Icon Header */}
                        <div className={`mb-6 p-4 ${current.iconBg} rounded-2xl`}>
                            {current.icon}
                        </div>

                        {/* Content */}
                        <h3 className="mb-2 text-2xl font-bold text-gray-900 tracking-tight">
                            {title}
                        </h3>
                        <p className="mb-8 text-gray-500 leading-relaxed">
                            {description}
                        </p>

                        {/* Actions */}
                        <div className="flex w-full gap-3">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="flex-1 font-semibold text-gray-600 hover:bg-gray-50 border border-gray-100"
                                disabled={isLoading}
                            >
                                {cancelText}
                            </Button>
                            <Button
                                onClick={onConfirm}
                                isLoading={isLoading}
                                className={`flex-1 font-semibold text-white shadow-lg transition-all duration-300 ${current.buttonBg}`}
                            >
                                {confirmText}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
