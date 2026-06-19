import { ImageIcon, Palette, Upload, X, Image as BannerIcon } from "lucide-react"
import { Button } from "../../components/Button"
import { Restaurant, RestaurantRequestResponse } from "../../features/restaurants/types"
import { FC, useRef } from "react"
import placeHolderImage from '../../assets/placeholder.png';
import { useAuth } from "../../hooks/useAuth";
import { fileToBase64 } from "../../utils";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../app/store";
import { uploadRestaurantBannerRequest, uploadRestaurantLogoRequest } from "../../features/restaurants/restaurantsSlice";

interface AppearanceProps {
    restaurantState: RestaurantRequestResponse | null
    restaurant: Restaurant | null
    imageLoading?: boolean
    handleRemoveLogo?: () => void
    handleRemoveBanner?: () => void
}

const Appearance: FC<AppearanceProps> = ({ restaurantState, restaurant, imageLoading, handleRemoveLogo, handleRemoveBanner }) => {
    const { user, primaryColor, updatePrimaryColor, } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const dispatch = useDispatch<AppDispatch>();

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user?.restaurant?.id) {
            const base64 = await fileToBase64(file);
            dispatch(uploadRestaurantLogoRequest({
                restaurantId: user.restaurant.id,
                image: base64
            }));
        }
    };

    const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user?.restaurant?.id) {
            const base64 = await fileToBase64(file);
            dispatch(uploadRestaurantBannerRequest({
                restaurantId: user.restaurant.id,
                image: base64
            }));
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const triggerBannerFileInput = () => {
        bannerInputRef.current?.click();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-pink-50 rounded-2xl shadow-sm">
                        <ImageIcon className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Brand Identity</h2>
                        <p className="text-sm text-gray-400 font-medium">Manage your restaurant logo and banner</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Logo Section */}
                    <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white bg-white shadow-xl flex items-center justify-center relative transition-transform duration-300 group-hover:scale-105">
                                {restaurantState?.logo || restaurant?.logo ? (
                                    <img
                                        src={restaurantState?.logo || restaurant?.logo || placeHolderImage}
                                        alt="Restaurant Logo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Logo</span>
                                    </div>
                                )}

                                {imageLoading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-20">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {(restaurantState?.logo || restaurant?.logo) && (
                                <button
                                    onClick={handleRemoveLogo}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-all hover:scale-110 active:scale-95 z-30"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div>
                                <h3 className="text-md font-bold text-gray-900">Restaurant Logo</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">
                                    Square ratio Recommended
                                </p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleLogoUpload}
                                accept="image/png,image/jpeg"
                                className="hidden"
                            />
                            <Button
                                onClick={triggerFileInput}
                                variant="primary"
                                disabled={imageLoading}
                                className="rounded-xl px-4 py-2 text-sm shadow-md"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                {restaurantState?.logo || restaurant?.logo ? 'Change' : 'Upload'}
                            </Button>
                        </div>
                    </div>

                    {/* Banner Section */}
                    <div className="flex flex-col gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                        <div className="relative group w-full h-32">
                            <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-white bg-white shadow-lg flex items-center justify-center relative transition-all duration-300">
                                {restaurantState?.banner || restaurant?.banner ? (
                                    <img
                                        src={restaurantState?.banner || restaurant?.banner || placeHolderImage}
                                        alt="Restaurant Banner"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <BannerIcon className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Banner</span>
                                    </div>
                                )}

                                {imageLoading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-20">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {(restaurantState?.banner || restaurant?.banner) && (
                                <button
                                    onClick={handleRemoveBanner}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-all hover:scale-110 active:scale-95 z-30"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-md font-bold text-gray-900">Restaurant Banner</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">
                                    Wide ratio recommended (16:9)
                                </p>
                            </div>
                            <input
                                type="file"
                                ref={bannerInputRef}
                                onChange={handleBannerUpload}
                                accept="image/png,image/jpeg"
                                className="hidden"
                            />
                            <Button
                                onClick={triggerBannerFileInput}
                                variant="primary"
                                disabled={imageLoading}
                                className="rounded-xl px-4 py-2 text-sm shadow-md"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                {restaurantState?.banner || restaurant?.banner ? 'Change' : 'Upload'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-purple-50 rounded-2xl shadow-sm">
                        <Palette className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Theme Customization</h2>
                        <p className="text-sm text-gray-400 font-medium">Design how your brand looks</p>
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                    <label className="block text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Brand Color</label>
                    <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-4 border-white group cursor-pointer ring-2 ring-gray-100">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => updatePrimaryColor(e.target.value)}
                                className="absolute inset-0 w-[200%] h-[200%] -top-[50%] -left-[50%] cursor-pointer p-0 border-0"
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-lg font-bold text-gray-900 tracking-tight mb-0.5">{primaryColor.toUpperCase()}</p>
                            <p className="text-sm font-medium text-gray-400">Main primary color used across the platform</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Appearance