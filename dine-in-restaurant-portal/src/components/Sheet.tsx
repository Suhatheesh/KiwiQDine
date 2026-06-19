import { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
}

export const Sheet = ({ isOpen, onClose, title, description, children, footer }: SheetProps) => {
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setShouldRender(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={`absolute inset-y-0 right-0 w-full md:max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    {title ? (
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                                {description && (
                                    <p className="text-sm text-gray-500 font-medium">{description}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-white bg-white/50 backdrop-blur-sm rounded-xl transition-all shadow-sm border border-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
