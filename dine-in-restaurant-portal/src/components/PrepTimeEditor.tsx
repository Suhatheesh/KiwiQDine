import { FC, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, Plus, Minus, Check, X } from "lucide-react";

interface PrepTimeEditorProps {
    currentTime: number;
    onSave: (newTime: number) => void;
    onCancel: () => void;
}

const PrepTimeEditor: FC<PrepTimeEditorProps> = ({ currentTime, onSave, onCancel }) => {
    const [time, setTime] = useState<number>(currentTime);

    const handleIncrement = (amount: number) => {
        setTime((prev) => Math.max(1, Math.min(180, prev + amount)));
    };

    const handleDecrement = (amount: number) => {
        setTime((prev) => Math.max(1, Math.min(180, prev - amount)));
    };

    const getTimeColor = () => {
        if (time <= 15) return "from-green-400 to-green-500";
        if (time <= 30) return "from-yellow-400 to-yellow-500";
        if (time <= 45) return "from-orange-400 to-orange-500";
        return "from-red-400 to-red-500";
    };

    const getGlowColor = () => {
        if (time <= 15) return "shadow-green-500/50";
        if (time <= 30) return "shadow-yellow-500/50";
        if (time <= 45) return "shadow-orange-500/50";
        return "shadow-red-500/50";
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-9999 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-linear-to-br ${getTimeColor()}`}>
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Additional Prep Time</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Adjust additional preparation duration</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Time Display */}
                <div className="mb-8">
                    <div className={`relative mx-auto w-48 h-48 rounded-3xl bg-linear-to-br ${getTimeColor()} shadow-2xl ${getGlowColor()} flex flex-col items-center justify-center transform hover:scale-105 transition-all duration-300`}>
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl"></div>
                        <div className="relative z-10 text-center">
                            <div className="text-7xl font-black text-white mb-2 tabular-nums tracking-tight">
                                {time}
                            </div>
                            <div className="text-sm font-bold text-white/90 uppercase tracking-widest">
                                minutes
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute top-4 right-4 w-3 h-3 bg-white/30 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-6 left-6 w-2 h-2 bg-white/20 rounded-full animate-pulse delay-75"></div>
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Large Increment */}
                        <button
                            onClick={() => handleIncrement(10)}
                            className="group relative overflow-hidden bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl py-4 px-6 font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Plus className="w-5 h-5" />
                                <span>10 min</span>
                            </div>
                        </button>

                        {/* Large Decrement */}
                        <button
                            onClick={() => handleDecrement(10)}
                            className="group relative overflow-hidden bg-linear-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl py-4 px-6 font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Minus className="w-5 h-5" />
                                <span>10 min</span>
                            </div>
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {/* Small Increments */}
                        {[5, 3, 1].map((amount) => (
                            <button
                                key={`inc-${amount}`}
                                onClick={() => handleIncrement(amount)}
                                className="bg-linear-to-br from-gray-100 to-gray-200 hover:from-blue-100 hover:to-blue-200 text-gray-700 hover:text-blue-700 rounded-lg py-3 px-3 font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                            >
                                +{amount}
                            </button>
                        ))}

                        {/* Small Decrements */}
                        <button
                            onClick={() => handleDecrement(1)}
                            className="bg-linear-to-br from-gray-100 to-gray-200 hover:from-purple-100 hover:to-purple-200 text-gray-700 hover:text-purple-700 rounded-lg py-3 px-3 font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                        >
                            -1
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(time)}
                        className="flex-1 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PrepTimeEditor;
