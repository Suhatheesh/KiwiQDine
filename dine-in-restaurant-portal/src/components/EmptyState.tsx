import { FC } from "react";
import { LucideIcon } from "lucide-react";
import { hexToRgba } from "../utils";
import { Button } from "./Button";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    iconColor?: string;
}

const EmptyState: FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    iconColor = "#3b82f6"
}) => {
    return (
        <div className="flex flex-col items-center justify-center h-[460px] animate-fade-in">
            <div className="relative">
                {/* Decorative background circles */}
                <div className="absolute inset-0 blur-3xl opacity-20">
                    <div className="w-32 h-32 rounded-full bg-blue-400 absolute top-0 left-0 animate-pulse"></div>
                    <div className="w-24 h-24 rounded-full bg-purple-400 absolute bottom-0 right-0 animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                {/* Icon container with glassmorphism */}
                <div className="relative bg-linear-to-br from-white to-gray-50 rounded-3xl p-8 shadow-xl border border-gray-200 mb-6">
                    <div style={{ background: hexToRgba(iconColor, 0.1) }} className="rounded-2xl p-6">
                        <Icon
                            className="w-16 h-16 animate-scale-in"
                            style={{ color: iconColor }}
                            strokeWidth={1.5}
                        />
                    </div>
                </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {title}
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {description}
            </p>

            {action && (
                <Button
                    onClick={action.onClick}
                    className="px-6 py-3 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all hover-lift animate-fade-in"
                    style={{ animationDelay: '0.3s' }}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
