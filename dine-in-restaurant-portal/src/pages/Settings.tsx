import { Save, Palette, Clock, Store, CheckSquare } from 'lucide-react';
import { useLayoutEffect, useState } from 'react';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { fetchRestaurantsByIdRequest, resetUploadedUrls, updateRestaurantsRequest, updateWaiterConfirmationRequest } from '../features/restaurants/restaurantsSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { Modal } from '../components/Modal';
import { Restaurant, RestaurantRequestResponse } from '../features/restaurants/types';
import { Image as DollarSign } from 'lucide-react';
import { enableServiceChargeRequest } from '../features/payment/paymentSlice';
import Appearance from '../sections/Settings/Appearance';

import { SettingsSkeleton } from '../components/CustomSkeleton';
import GenaralTab from '../sections/Settings/GenaralTab';
import OpenHoursTab from '../sections/Settings/OpenHoursTab';
import FinancialTab from '../sections/Settings/FinancialTab';
import WaiterConfirmationTab from '../sections/Settings/WaiterConfirmationTab';
import UpdateConfirm from '../sections/Model/Settings/UpdateConfirm';

export const Settings = () => {
  const { user, primaryColor, updateRestaurantLogo, updateRestaurantName, updateWaiterConfirmation } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { restaurant, imageLoading, loading, uploadedLogoUrl, uploadedBannerUrl } = useSelector((state: RootState) => state.restaurant);

  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'hours' | 'financial' | 'waiterConfirmation'>('general');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [restaurantState, setRestaurantState] = useState<RestaurantRequestResponse | null>(null);
  const [baselineRestaurant, setBaselineRestaurant] = useState<Restaurant | null>(null);

  const allTabs = [
    { id: 'general', label: 'General', icon: Store, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'appearance', label: 'Appearance', icon: Palette, iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'hours', label: 'Opening Hours', icon: Clock, iconColor: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'financial', label: 'Financial', icon: DollarSign, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { id: 'waiterConfirmation', label: 'Waiter Confirmation', icon: CheckSquare, iconColor: 'text-teal-600', bgColor: 'bg-teal-50' },
  ];

  const tabs = allTabs.filter(tab =>
    tab.id !== 'waiterConfirmation' || user?.restaurant?.paymentTiming === 'pay_at_last'
  );

  useLayoutEffect(() => {
    dispatch(fetchRestaurantsByIdRequest({ tenantId: user?.tenant?.id || "", restaurantId: user?.restaurant?.id || "" }))
  }, [dispatch])

  useLayoutEffect(() => {
    if (restaurant) {
      if (!baselineRestaurant) {
        setBaselineRestaurant(restaurant);
      }

      setRestaurantState({
        name: restaurant?.name,
        contactEmail: restaurant?.contactEmail,
        contactPhoneNumber: restaurant?.contactPhoneNumber,
        openTime: restaurant?.openTime,
        closeTime: restaurant?.closeTime,
        logo: restaurant?.logo,
        banner: restaurant?.banner,
        address: restaurant?.address,
        openHours: restaurant?.openHours || {
          monday: { open: '09:00', close: '22:00', closed: false },
          tuesday: { open: '09:00', close: '22:00', closed: false },
          wednesday: { open: '09:00', close: '22:00', closed: false },
          thursday: { open: '09:00', close: '22:00', closed: false },
          friday: { open: '09:00', close: '22:00', closed: false },
          saturday: { open: '09:00', close: '22:00', closed: false },
          sunday: { open: '10:00', close: '20:00', closed: false }
        },
        applyServiceCharge: restaurant?.applyServiceCharge || false,
        serviceChargePercentage: restaurant?.serviceChargePercentage || 0,
        serviceChargeType: restaurant?.serviceChargeType || 'percentage',
        fixedServiceCharge: restaurant?.fixedServiceCharge || 0,
        bankDetails: restaurant?.bankDetails || {
          bankName: '',
          accountName: '',
          accountNumber: '',
          branch: '',
          iban: '',
          swiftCode: ''
        },
        requireWaiterConfirmation: user?.restaurant?.requireWaiterConfirmation || false
      })
    }
  }, [restaurant, baselineRestaurant === null])

  useLayoutEffect(() => {
    if (uploadedLogoUrl && restaurantState && uploadedLogoUrl !== restaurantState.logo) {
      setRestaurantState(prev => prev ? ({ ...prev, logo: uploadedLogoUrl }) : null);
    }
    if (uploadedBannerUrl && restaurantState && uploadedBannerUrl !== restaurantState.banner) {
      setRestaurantState(prev => prev ? ({ ...prev, banner: uploadedBannerUrl }) : null);
    }
  }, [uploadedLogoUrl, uploadedBannerUrl])

  useLayoutEffect(() => {
    return () => {
      dispatch(resetUploadedUrls());
    }
  }, [])

  const handleSaveClick = () => {
    setIsConfirmModalOpen(true);
  }

  const handleConfirmUpdate = () => {
    const cleanBankDetails = restaurantState?.bankDetails ? {
      bankName: restaurantState.bankDetails.bankName,
      accountName: restaurantState.bankDetails.accountName,
      accountNumber: restaurantState.bankDetails.accountNumber,
      branch: restaurantState.bankDetails.branch,
      iban: restaurantState.bankDetails.iban,
      swiftCode: restaurantState.bankDetails.swiftCode
    } : undefined;

    dispatch(updateRestaurantsRequest({
      tenantId: user?.tenant?.id || "",
      restaurantID: user?.restaurant?.id || "",
      name: restaurantState?.name ?? "RestaurantOS",
      contactEmail: restaurantState?.contactEmail ?? "support@restaurantos.com",
      contactPhoneNumber: restaurantState?.contactPhoneNumber ?? "+1-800-RESTO",
      openTime: restaurantState?.openTime,
      closeTime: restaurantState?.closeTime,
      logo: restaurantState?.logo ?? "",
      banner: restaurantState?.banner ?? "",
      address: restaurantState?.address,
      openHours: restaurantState?.openHours,
      bankDetails: cleanBankDetails,
      primaryColor: primaryColor ?? "#2563EB"
    }))
    setIsConfirmModalOpen(false);
    updateRestaurantLogo(restaurantState?.logo ?? "");
    // If there was an updateRestaurantBanner in useAuth, I'd call it here too.
    updateRestaurantName(restaurantState?.name ?? "RestaurantOS");
    dispatch(enableServiceChargeRequest({
      restaurantId: user?.restaurant?.id || "",
      applyServiceCharge: restaurantState?.applyServiceCharge || false,
      serviceChargePercentage: Number(restaurantState?.serviceChargePercentage) || 0,
      serviceChargeType: restaurantState?.serviceChargeType || "percentage",
      fixedServiceCharge: Number(restaurantState?.fixedServiceCharge) || 0
    }))
    dispatch(updateWaiterConfirmationRequest({
      restaurantId: user?.restaurant?.id || "",
      enable: restaurantState?.requireWaiterConfirmation || false
    }))
    updateWaiterConfirmation(restaurantState?.requireWaiterConfirmation || false);
    setBaselineRestaurant(null); // Reset baseline to force resync on next restaurant update
    dispatch(resetUploadedUrls());
  }

  const handleCancelUpdate = () => {
    setIsConfirmModalOpen(false);
  }

  const handleRemoveLogo = () => {
    setRestaurantState(prev => prev ? ({ ...prev, logo: '' }) : null);
  };

  const handleRemoveBanner = () => {
    setRestaurantState(prev => prev ? ({ ...prev, banner: '' }) : null);
  };

  if (loading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      {/* Header with Tabs - Professional Clean Design */}
      <div className="sticky top-16 z-50 backdrop-blur-md border-b border-gray-200 mb-6 mx-1 px-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 relative group transition-all duration-300 ${isActive ? 'font-bold' : 'font-medium text-gray-500 hover:text-gray-900'
                  }`}
                style={isActive ? { color: primaryColor } : {}}
              >
                <Icon
                  className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 text-gray-400 group-hover:text-gray-600'
                    }`}
                  style={isActive ? { color: primaryColor } : {}}
                />
                <span className="text-sm tracking-wide">{tab.label}</span>

                {/* Active Indicator */}
                <div
                  className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-all duration-300 ${isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-30 group-hover:scale-x-50'
                    }`}
                  style={{ backgroundColor: primaryColor }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* General Tab */}
        {activeTab === 'general' && (
          <GenaralTab
            restaurantState={restaurantState}
            restaurant={restaurant}
            setRestaurantState={setRestaurantState}
          />
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <Appearance
            restaurantState={restaurantState}
            restaurant={restaurant}
            imageLoading={imageLoading}
            handleRemoveLogo={handleRemoveLogo}
            handleRemoveBanner={handleRemoveBanner} />
        )}

        {/* Opening Hours Tab */}
        {activeTab === 'hours' && (
          <OpenHoursTab
            restaurantState={restaurantState}
            setRestaurantState={setRestaurantState}
            primaryColor={primaryColor}
          />
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <FinancialTab
            primaryColor={primaryColor}
            restaurantState={restaurantState}
            setRestaurantState={setRestaurantState}
          />
        )}

        {/* Waiter Confirmation Tab */}
        {activeTab === 'waiterConfirmation' && (
          <WaiterConfirmationTab
            primaryColor={primaryColor}
            restaurantState={restaurantState}
            setRestaurantState={setRestaurantState}
          />
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="sticky bottom-6 flex items-center justify-end gap-3 z-40 px-6 pointer-events-none">
        <Button
          onClick={handleSaveClick}
          className={`shadow-2xl shadow-blue-200 rounded-2xl py-4 px-10 text-lg font-black tracking-tight scale-110 transition-all pointer-events-auto ${(!restaurant || !restaurantState || JSON.stringify(restaurantState) === JSON.stringify(restaurant)) ? 'opacity-50 grayscale cursor-not-allowed scale-100' : 'hover:scale-115 active:scale-105'}`}
        >
          <Save className="w-5 h-5 mr-3" />
          Update Settings
        </Button>
      </div>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelUpdate}
        title="Update Confirmation"
        size="md"
      >
        <UpdateConfirm
          restaurant={baselineRestaurant}
          restaurantState={restaurantState as Restaurant}
          handleCancelUpdate={handleCancelUpdate}
          handleConfirmUpdate={handleConfirmUpdate}
        />
      </Modal>
    </div>
  );


};

