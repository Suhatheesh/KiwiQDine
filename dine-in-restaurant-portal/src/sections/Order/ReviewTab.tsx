import { ChefHat, Heart, Sparkles, Wallet, Star } from "lucide-react"
import { StarRating } from "../../components/StarRating"
import { FC } from "react"

interface ReviewTabProps {
    rate: any
}

const ReviewTab: FC<ReviewTabProps> = ({ rate }) => {
    return (
        <div className="flex-1 overflow-y-auto h-full p-6 animate-in fade-in slide-in-from-bottom-2 duration-300 custom-scrollbar pb-24">
            {rate ? (
                <div className="flex flex-col gap-6">
                    {/* Review UI ... */}
                    <div className="p-6 bg-linear-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 rounded-3xl shadow-sm">
                        {/* ... rest of review UI */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl shadow-md border border-amber-100">
                                        <StarRating rating={rate.rating} showLabel={false} size="lg" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">Overall Rating</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-black text-amber-600">{rate.rating.toFixed(1)}</span>
                                            <span className="text-gray-400 font-medium">/ 5.0</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                    Customer Review
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/70 rounded-2xl border border-amber-100/50 hover:bg-white transition-colors duration-200">
                                    <div className="flex items-center gap-2 mb-2 text-gray-600">
                                        <ChefHat className="w-4 h-4 text-orange-500" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest">Food Quality</span>
                                    </div>
                                    <StarRating rating={rate.metadata?.foodQuality || 0} showLabel={false} size="sm" />
                                </div>
                                <div className="p-4 bg-white/70 rounded-2xl border border-amber-100/50 hover:bg-white transition-colors duration-200">
                                    <div className="flex items-center gap-2 mb-2 text-gray-600">
                                        <Heart className="w-4 h-4 text-red-500" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest">Service</span>
                                    </div>
                                    <StarRating rating={rate.metadata?.service || 0} showLabel={false} size="sm" />
                                </div>
                                <div className="p-4 bg-white/70 rounded-2xl border border-amber-100/50 hover:bg-white transition-colors duration-200">
                                    <div className="flex items-center gap-2 mb-2 text-gray-600">
                                        <Sparkles className="w-4 h-4 text-blue-500" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest">Ambiance</span>
                                    </div>
                                    <StarRating rating={rate.metadata?.ambiance || 0} showLabel={false} size="sm" />
                                </div>
                                <div className="p-4 bg-white/70 rounded-2xl border border-amber-100/50 hover:bg-white transition-colors duration-200">
                                    <div className="flex items-center gap-2 mb-2 text-gray-600">
                                        <Wallet className="w-4 h-4 text-green-500" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest">Value for Money</span>
                                    </div>
                                    <StarRating rating={rate.metadata?.valueForMoney || 0} showLabel={false} size="sm" />
                                </div>
                            </div>
                            {rate.comment && (
                                <div className="relative mt-2 p-5 bg-white/40 rounded-2xl border border-amber-100/30">
                                    <div className="absolute -left-1 top-4 bottom-4 w-1.5 bg-amber-400 rounded-full opacity-40 shadow-sm" />
                                    <p className="pl-4 text-sm text-gray-700 italic leading-relaxed font-medium">
                                        "{rate.comment}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                        <Star className="w-10 h-10 text-gray-200" />
                    </div>
                    <div>
                        <h3 className="text-gray-900 font-bold text-lg">No Review Yet</h3>
                        <p className="text-gray-500 text-sm max-w-[240px] mt-1 line-clamp-2">
                            This customer hasn't provided feedback for this order yet.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ReviewTab