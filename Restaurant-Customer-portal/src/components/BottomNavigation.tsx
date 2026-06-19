import { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, ShoppingBasket, User } from "lucide-react";
import { RootLinks } from "../routers/types";
import { useSelector } from "react-redux";
import { RootState } from "../app/store";

const BottomNavigation: FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { cartResponse } = useSelector((state: RootState) => state.cart);

    const cartCount = cartResponse?.items.length ?? 0;

    const isActive = (path: string) => {
        if (path === RootLinks.RESTAURANTLIST && (location.pathname === RootLinks.RESTAURANTLIST || location.pathname === RootLinks.MENU)) {
            return true;
        }
        return location.pathname === path;
    };

    const navItems = [
        {
            label: "Home",
            icon: Home,
            path: RootLinks.RESTAURANTLIST,
            isActiveCheck: () => isActive(RootLinks.RESTAURANTLIST)
        },
        {
            label: "Cart",
            icon: ShoppingBasket,
            path: RootLinks.REVIEWORDER,
            isActiveCheck: () => isActive(RootLinks.REVIEWORDER)
        },
        {
            label: "Profile",
            icon: User,
            path: RootLinks.ONGOINGORDERS,
            isActiveCheck: () => isActive(RootLinks.ONGOINGORDERS)
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.04)] border-t border-gray-50 pb-safe">
                <div className="flex items-center justify-around h-20 px-2 max-w-md mx-auto">
                    {navItems.map((item) => {
                        const active = item.isActiveCheck();
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center justify-center w-20 gap-1.5 transition-all duration-300 ${active ? "text-[#1a1c1e]" : "text-gray-400 hover:text-gray-600"
                                    }`}
                            >
                                <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${active ? "bg-black text-white shadow-lg shadow-black/20" : "bg-transparent"
                                    }`}>
                                    <Icon
                                        className={`w-6 h-6 ${active ? "fill-current" : "stroke-[2.5]"}`}
                                        absoluteStrokeWidth={true}
                                    />
                                    {item.label === "Cart" && cartCount > 0 && (
                                        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                                            {cartCount > 9 ? '9+' : cartCount}
                                        </div>
                                    )}
                                </div>
                                <span className={`text-[10px] font-bold tracking-wide transition-all ${active ? "opacity-100" : "opacity-80"
                                    }`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BottomNavigation;
