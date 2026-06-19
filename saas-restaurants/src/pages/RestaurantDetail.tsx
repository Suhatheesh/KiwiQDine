import { FC, useState, useEffect, useMemo } from 'react';
import {
    RestaurantDetailSkeleton
} from '../components/CustomSkeleton';
import {

    MapPin,
    Clock,
    Globe,
    Share2,
    Edit,
    ChevronLeft,
    CreditCard,
    Receipt
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { StaffTab } from '../sections/RestaurantDetail/StaffTab';
import { TablesTab } from '../sections/RestaurantDetail/TablesTab';
import { MenuTab } from '../sections/RestaurantDetail/MenuTab';
import { AnalyticsTab } from '../sections/RestaurantDetail/AnalyticsTab';
import { InvoicesTab } from '../sections/RestaurantDetail/InvoicesTab';
import WalletTab from '../sections/RestaurantDetail/WalletTab';
import BankDetailsTab from '../sections/RestaurantDetail/BankDetailsTab';
import { Button } from '../components/Button';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { fetchAllTenantRequest } from '../features/tenants/tenantsSlice';
import { TenantType } from '../utils/constants';
import { Building2, Store } from 'lucide-react';
import { fetchRestaurantByIdRequest } from '../features/restaurants/restaurantsSlice';
import QRTab from '../sections/RestaurantDetail/QRTab';
import { fetchCurrentPlanRequest } from '../features/subscriptions/subscriptionsSlice';

const tabs = [
    { id: 'staff', label: 'Staff' },
    { id: 'tables', label: 'Tables' },
    { id: 'qr', label: 'QR' },
    { id: 'menu', label: 'Menu' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'bankDetails', label: 'Bank Details' },
];

export const RestaurantDetail: FC = () => {
    const navigate = useNavigate();
    const { id, type } = useParams<{ id: string, type: string }>();
    const [activeTab, setActiveTab] = useState('staff');

    const dispatch = useDispatch<AppDispatch>();
    const { data: tenants } = useSelector((state: RootState) => state.tenants);

    const { restaurant, loading } = useSelector((state: RootState) => state.restaurant);
    const { currentPlan } = useSelector((state: RootState) => state.subscriptions);

    // Get tenant information for this restaurant
    const tenant = restaurant?.tenantId ? tenants.find(t => t.id === restaurant.tenantId) : null;
    const isFoodCourt = tenant?.type === TenantType.FOOD_COURT;


    useEffect(() => {
        if (!id) return;
        dispatch(fetchCurrentPlanRequest(id));
        dispatch(fetchRestaurantByIdRequest(id));
    }, [id]);

    useEffect(() => {
        dispatch(fetchAllTenantRequest({ page: 1, limit: 100 }));
    }, [dispatch]);

    const renderTabContent = () => {
        if (!restaurant) return null;

        switch (activeTab) {
            case 'staff': return <StaffTab restaurantId={restaurant.id} tenantId={restaurant.tenantId} />;
            case 'tables': return <TablesTab restaurantId={restaurant.id} tenantId={restaurant.tenantId} />;
            case 'qr': return <QRTab restaurantId={restaurant.id} />;
            case 'menu': return <MenuTab restaurantId={restaurant.id} />;
            case 'analytics': return <AnalyticsTab restaurantId={restaurant.id} />;
            case 'invoices': return <InvoicesTab />;
            case 'wallet': return <WalletTab />;
            case 'bankDetails': return <BankDetailsTab restaurantId={restaurant.id} />;
            default: return <StaffTab restaurantId={restaurant.id} tenantId={restaurant.tenantId} />;
        }
    };

    const filterTabList = useMemo(() => {
        if (!restaurant) return [];
        return type === TenantType.RESTAURANT ? tabs : tabs.filter(tab => tab.id !== 'tables');
    }, [restaurant, type]);

    if (loading) {
        return <RestaurantDetailSkeleton />;
    }

    if (!restaurant) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-gray-500">Restaurant not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header Section with Cover Image */}
            <div className="relative h-64 w-full">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200"
                        alt="Restaurant Cover"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent backdrop-blur-[2px]"></div>
                    {/* Dynamic gradient overlay based on restaurant type */}
                    {tenant && (
                        <div className={`absolute inset-0 bg-gradient-to-br opacity-20 ${isFoodCourt ? 'from-purple-500/30 to-blue-500/30' : 'from-blue-500/30 to-cyan-500/30'
                            }`}></div>
                    )}
                </div>

                <div className="absolute top-6 left-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 px-4 py-2 rounded-full backdrop-blur-md transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Restaurants
                    </button>
                </div>
            </div>

            {/* Restaurant Info Card */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                        <div className="flex items-start gap-6">
                            <div className="w-24 h-24 rounded-xl bg-gray-100 border-4 border-white shadow-md overflow-hidden -mt-12">
                                <img
                                    src={restaurant.logo || 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=150'}
                                    alt={restaurant.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${restaurant.isActive
                                        ? 'bg-green-50 text-green-700 border-green-100'
                                        : 'bg-gray-50 text-gray-700 border-gray-100'
                                        }`}>
                                        {restaurant.isActive ? 'Open Now' : 'Closed'}
                                    </span>
                                    {/* Restaurant Type Badge */}
                                    {tenant && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${isFoodCourt
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                            {isFoodCourt ? (
                                                <>
                                                    <Building2 className="w-3 h-3" />
                                                    Food Court Outlet
                                                </>
                                            ) : (
                                                <>
                                                    <Store className="w-3 h-3" />
                                                    Restaurant
                                                </>
                                            )}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    {tenant && (
                                        <div className="flex items-center gap-1">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium text-gray-900">Tenant:</span>
                                            {tenant.name}
                                        </div>
                                    )}
                                    {restaurant.address && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            {restaurant.address.lane}, {restaurant.address.city}
                                        </div>
                                    )}
                                    {restaurant.paymentTiming && (
                                        <div className="flex items-center gap-1">
                                            <CreditCard className="w-4 h-4 text-gray-400" />
                                            <span className="capitalize">{restaurant.paymentTiming.replace('_', ' ')}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Receipt className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">{currentPlan?.name} Plan</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        09:00 AM - 11:00 PM
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                                <Globe className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <Button variant="secondary">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Info
                            </Button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 mt-8 border-b border-gray-100 overflow-x-auto no-scrollbar">
                        {filterTabList.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  px-6 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                  ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="pb-12 animate-fade-in">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};
