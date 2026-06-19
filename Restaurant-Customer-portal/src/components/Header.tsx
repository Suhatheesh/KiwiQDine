import { ArrowLeft } from "lucide-react";
import { FC } from "react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
    title: string;
    showBackButton?: boolean;
    onBack?: () => void;
}

const Header: FC<HeaderProps> = ({ title, showBackButton = true, onBack }) => {

    const navigate = useNavigate();

    const handleBack = () => {
        onBack ? onBack() : navigate(-1);
    };

    return (
        <header className="fixed z-50 w-full top-0 bg-white/95 overflow-hidden">

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center">
                {/* Enhanced Back Button */}
                {showBackButton && (
                    <button
                        onClick={handleBack}
                        className="absolute left-4 p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95  hover:shadow-md group"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="h-5 w-5 text-black transition-colors" />
                    </button>
                )}

                {/* Title with Gradient */}
                <h1 className="text-xl sm:text-2xl font-semibold text-black">
                    {title}
                </h1>
            </div>
        </header>
    );
};

export default Header;