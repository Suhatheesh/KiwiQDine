import { FC } from "react";
import { QR } from "../features/qr/types";
import { Button } from "./Button";
import { Eye, QrCode } from "lucide-react";
import { QRStatus, QRTableType } from "../utils/constants";
import { IOSSwitch } from "./Switch";

interface QRCardProps {
    isSelected?: boolean;
    data: QR;
    disableDownload?: boolean;
    disableView?: boolean;
    onClick?: (data: QR) => void;
    onEdit?: (data: QR) => void;
    onView?: (data: QR) => void;
}

const QRCard: FC<QRCardProps> = ({ data, isSelected, disableView, onClick, onEdit, onView }) => {
    const isActive = data.status === QRStatus.ACTIVE;

    const getTypeConfig = (type: string) => {
        if (type.includes(QRTableType.TAKE_AWAY)) return { label: 'Take Away', color: isActive ? 'bg-amber-500 text-white shadow-amber-500/50' : 'bg-gray-400 text-white' };
        if (type.includes(QRTableType.PARKING)) return { label: 'Parking', color: isActive ? 'bg-blue-500 text-white shadow-blue-500/50' : 'bg-gray-400 text-white' };
        if (type.includes(QRTableType.FOOD_COURT)) return { label: 'Food Court', color: isActive ? 'bg-purple-500 text-white shadow-purple-500/50' : 'bg-gray-400 text-white' };
        return { label: 'Table', color: isActive ? 'bg-emerald-500 text-white shadow-emerald-500/50' : 'bg-gray-400 text-white' };
    };

    const typeConfig = getTypeConfig(data.type);

    return (
        <div
            className={`group relative flex h-[280px] flex-col bg-white rounded-xl border-2 hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden ${isSelected ? 'border-indigo-400 shadow-lg' : 'border-gray-200'
                }`}
            onClick={() => onClick && onClick(data)}
        >
            {/* Premium Header with Brand Colors */}
            <div className={`relative h-36 ${isActive
                ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600'
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 left-2 w-16 h-16 border-2 border-white rounded-lg rotate-12"></div>
                    <div className="absolute bottom-2 right-2 w-20 h-20 border-2 border-white rounded-lg -rotate-6"></div>
                </div>

                {/* QR Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`rounded-2xl p-4 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${isActive ? 'bg-white/20 backdrop-blur-sm border-2 border-white/30' : 'bg-white shadow-md'}`}>
                        <QrCode className={`w-14 h-14 ${isActive ? 'text-white' : 'text-gray-600'}`} strokeWidth={2} />
                    </div>
                </div>

                {/* Type Badge (Left) */}
                <div className="absolute top-3 left-3">
                    <div className={`${typeConfig.color} shadow-lg px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                        {typeConfig.label}
                    </div>
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                    <div className={`${isActive
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                        : 'bg-gray-400 text-white shadow-md'
                        } px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                        {isActive ? '✓ Live' : 'Inactive'}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col p-5 space-y-3">
                {/* QR Name & Switch */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 truncate">
                            {data.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                                {isActive ? 'Scannable' : 'Disabled'}
                            </p>
                        </div>
                    </div>
                    <IOSSwitch
                        checked={isActive}
                        onChange={() => onEdit && onEdit(data)}
                    />
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                {/* Action Button */}
                <Button
                    disabled={disableView}
                    className={`w-full justify-center ${isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                        : 'bg-gray-600 hover:bg-gray-700'
                        } text-white border-0 shadow-sm font-semibold`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onView && onView(data);
                    }}
                >
                    <Eye className="w-4 h-4 mr-2" />
                    View & Download
                </Button>
            </div>

            {/* Hover Effect */}
            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isActive
                ? 'shadow-[0_0_25px_rgba(139,92,246,0.3)]'
                : 'shadow-[0_0_15px_rgba(156,163,175,0.2)]'
                }`}></div>
        </div>
    );
}

export default QRCard;