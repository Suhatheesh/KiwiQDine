import { useCallback, useLayoutEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Search, Edit2, Eye, X, Filter, TrendingUp, Store, CheckCircle2, AlertCircle, Zap, Wallet, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { createRestaurantsRequest, deleteRestaurantsRequest, fetchAllRestaurantRequest, fetchAllRestaurantsByTenantRequest, fetchRestaurantSummaryRequest, increaseLimit, pagination, reactivateRestaurantsRequest, updateRestaurantsRequest, uploadRestaurantImageRequest } from '../features/restaurants/restaurantsSlice';
import { toast } from 'react-toastify';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Restaurant, RestaurantRequestResponse } from '../features/restaurants/types';
import { useAuth } from '../hooks/useAuth';
import { PaymentTiming, TenantStatus, TenantType, UserRole } from '../utils/constants';
import { getAllDistricts, getCitiesByDistrict } from '../utils/sriLankaData';
import { EditRestaurantModal } from '../components/EditRestaurantModal';
import { fileToBase64, formatPhoneNumber, validateNZPhoneNumber } from '../utils';
import RestaurantModelSection from '../sections/Model/Restaurant/RestaurantModelSection';

export const Restaurants = () => {

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [isOverLimit, setIsOverLimit] = useState<string>("");
  const [planCode, setPlanCode] = useState<string>("");
  const [minWalletBalance, setMinWalletBalance] = useState<string>("");
  const [maxWalletBalance, setMaxWalletBalance] = useState<string>("");

  // Get available cities based on selected district
  const availableCities = useMemo(() => {
    if (!districtFilter) return [];
    return getCitiesByDistrict(districtFilter);
  }, [districtFilter]);

  // Reset city when district changes
  const handleDistrictChange = (district: string) => {
    setDistrictFilter(district);
    setCityFilter(""); // Reset city when district changes
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDistrictFilter("");
    setCityFilter("");
    setIsOverLimit("");
    setPlanCode("");
    setMinWalletBalance("");
    setMaxWalletBalance("");
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>();

  const dispatch = useDispatch<AppDispatch>()
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: filteredRestaurants, image, loading, isCreateRestaurant, isDeleteRestaurant, error, limit, page, total, summary, imageLoading } = useSelector((state: RootState) => state.restaurant);
  const { data: tenants } = useSelector((state: RootState) => state.tenants);

  const { register, handleSubmit, getValues, watch, reset, control } = useForm<RestaurantRequestResponse>({
    defaultValues: {
      name: "",
      contactEmail: "",
      contactPhoneNumber: "",
      address: {},
      logo: "",
      tenantId: "",
      paymentTiming: PaymentTiming.PAY_AT_LAST,
      openTime: "09:00",
      closeTime: "22:00",
      openHours: null
    },
  });

  const selectTenantId = watch('tenantId');

  const filterTenant = tenants.filter(i =>
    i.status === TenantStatus.ACTIVE
  ).map((tenant) => {
    return {
      value: tenant.id,
      label: tenant.name
    }
  });

  const validateToasts = useCallback(() => {
    if (isCreateRestaurant || error) {
      setIsModalOpen(false);
    }
    if (isDeleteRestaurant || error) {
      handleCloseModal();
    }
  }, [isCreateRestaurant, isDeleteRestaurant, error])

  useLayoutEffect(() => {
    validateToasts();
  }, [validateToasts])

  useLayoutEffect(() => {
    if (user?.role === UserRole.TENANT_ADMIN) {
      dispatch(fetchAllRestaurantsByTenantRequest({ page: Number(page), limit: Number(limit), tenantId: user.tenantId }))
    } else {
      // Only send non-empty filter values to avoid API errors
      const filters: any = {
        page: Number(page),
        limit: Number(limit),
      };

      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      if (cityFilter) filters.city = cityFilter;
      if (districtFilter) filters.district = districtFilter;
      if (isOverLimit) filters.isOverLimit = isOverLimit === 'true';
      if (planCode) filters.planCode = planCode;
      if (minWalletBalance) filters.minWalletBalance = Number(minWalletBalance);
      if (maxWalletBalance) filters.maxWalletBalance = Number(maxWalletBalance);

      dispatch(fetchAllRestaurantRequest(filters));
    }
  }, [dispatch, searchTerm, user, page, limit, statusFilter, cityFilter, districtFilter, isOverLimit, planCode, minWalletBalance, maxWalletBalance])

  // Fetch summary data only once on initial load
  useLayoutEffect(() => {
    if (user?.role !== UserRole.TENANT_ADMIN) {
      dispatch(fetchRestaurantSummaryRequest('month'));
    }
  }, [dispatch, user]);

  const handleEdit = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    setIsModalOpen(true);
  };

  const handleDelete = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    setIsDeleteModalOpen(true)
  }

  const handleAdd = () => {
    reset({ name: "", contactEmail: "", contactPhoneNumber: "", address: {}, logo: "", tenantId: "" })
    setIsModalOpen(true);
    setSelectedRestaurant(null)
  };

  const handleCreateRestaurant: SubmitHandler<RestaurantRequestResponse> = (data) => {
    if (getValues('tenantId').length <= 0) {
      toast.error("Please choose the relevan Tenant")
      return;
    }
    // Format phone number with +94
    const formattedData = {
      ...data,
      contactPhoneNumber: formatPhoneNumber(data.contactPhoneNumber),
      logo: image?.url ?? ''
    };
    dispatch(createRestaurantsRequest(formattedData))
  };

  const handleEditRestaurant = (data: RestaurantRequestResponse) => {
    // Format phone number with +94
    const formattedData = {
      ...data,
      contactPhoneNumber: formatPhoneNumber(data.contactPhoneNumber),
      logo: image?.url ?? ''
    };
    dispatch(updateRestaurantsRequest(formattedData))
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedRestaurant(null)
  };

  const handleDeleteConfirm = () => {
    if (selectedRestaurant?.isActive) {
      dispatch(deleteRestaurantsRequest(selectedRestaurant!))
    } else {
      dispatch(reactivateRestaurantsRequest({ tenantId: selectedRestaurant?.tenantId ?? "", restaurantId: selectedRestaurant?.id ?? "" }))
    }
  }

  const handleChangePage = (_event: unknown, page: number) => {
    dispatch(pagination(String(page)))
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    dispatch(increaseLimit(event.target.value))
  }

  const handleViewRestaurant = (tenantId: string, restaurantId?: string) => {
    const tenant = tenants.find((i) => i.id === tenantId)
    let tenantType: string = TenantType.RESTAURANT;
    if (tenant?.type) {
      tenantType = tenant.type
    }
    navigate(`/restaurants/${tenantId}/${restaurantId}/${tenantType}`)
  }

  const handleImageUpload = async (file: File | null) => {
    if (file) {
      const base64 = await fileToBase64(file);
      dispatch(uploadRestaurantImageRequest({ image: base64 }));
    }
  };

  const isTenantHasRestaurant = selectedRestaurant === null && filteredRestaurants.some((i) => i.tenantId === selectTenantId)
  const isPhoneNumberValid = validateNZPhoneNumber(watch('contactPhoneNumber'));

  const isDisable = watch('name') === '' || watch('contactEmail') === '' || watch('contactPhoneNumber') === '' || watch('address.city') === '' || watch('address.district') === '' || watch('address.country') === '' || watch('address.lane') === '' || watch('tenantId') === '' || !isPhoneNumberValid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Management</h1>
          <p className="text-gray-600">Manage all restaurants and their configurations</p>
        </div>
        <Button onClick={handleAdd} disabled={loading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Restaurant
        </Button>
      </div>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">{summary?.totalRestaurants.label || 'Total Restaurants'}</p>
              <h3 className="text-3xl font-bold">{summary?.totalRestaurants.value ?? total}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Store className="w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">{summary?.activeRestaurants.label || 'Active'}</p>
              <h3 className="text-3xl font-bold">{summary?.activeRestaurants.value ?? filteredRestaurants.filter(r => r.isActive).length}</h3>
              {summary?.activeRestaurants.growth && (
                <p className="text-green-100 text-xs mt-1">+{summary.activeRestaurants.growth}% from last period</p>
              )}
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Over Limit</p>
              <h3 className="text-3xl font-bold">{filteredRestaurants.filter(r => r.subscription?.isOverLimit).length}</h3>
              <p className="text-orange-100 text-xs mt-1">Requiring Attention</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">{summary?.overallGrowth.label || 'Overall Growth'}</p>
              <h3 className="text-3xl font-bold">+{summary?.overallGrowth.value ?? 18}%</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Filter Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <p className="text-sm text-gray-500">Refine your search results</p>
              </div>
            </div>
            {(searchTerm || statusFilter || districtFilter || cityFilter || isOverLimit || planCode || minWalletBalance || maxWalletBalance) && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 font-medium text-sm group"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm"
              />
            </div>

            {/* Status Select */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* District Select */}
            <div className="relative">
              <select
                value={districtFilter}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm appearance-none cursor-pointer"
              >
                <option value="">All Districts</option>
                {getAllDistricts().map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* City Select */}
            <div className="relative">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                disabled={!districtFilter}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{districtFilter ? "All Cities" : "Select District First"}</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Plan Limit Filter */}
            <div className="relative">
              <select
                value={isOverLimit}
                onChange={(e) => setIsOverLimit(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm appearance-none cursor-pointer"
              >
                <option value="">Billing Status</option>
                <option value="true">⚠️ Over Limit</option>
                <option value="false">✅ Within Limit</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Plan Tier Filter */}
            <div className="relative">
              <select
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm appearance-none cursor-pointer"
              >
                <option value="">All Plan Tiers</option>
                <option value="basic">Basic Plan</option>
                <option value="pro">Pro Plan</option>
                <option value="enterprise">Enterprise Plan</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Wallet Balance Filters */}
            <div className="relative">
              <input
                type="number"
                placeholder="Min Balance"
                value={minWalletBalance}
                onChange={(e) => setMinWalletBalance(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm"
              />
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Max Balance"
                value={maxWalletBalance}
                onChange={(e) => setMaxWalletBalance(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Active Filter Chips */}
          {(searchTerm || statusFilter || districtFilter || cityFilter || isOverLimit || planCode || minWalletBalance || maxWalletBalance) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-500 py-2">Active Filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium animate-fadeIn">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm("")} className="hover:bg-blue-100 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium animate-fadeIn">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter("")} className="hover:bg-green-100 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {districtFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium animate-fadeIn">
                  District: {districtFilter}
                  <button onClick={() => setDistrictFilter("")} className="hover:bg-purple-100 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {cityFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium animate-fadeIn">
                  City: {cityFilter}
                  <button onClick={() => setCityFilter("")} className="hover:bg-orange-100 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {isOverLimit && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-medium animate-fadeIn">
                  {isOverLimit === 'true' ? 'Over Limit' : 'Within Limit'}
                  <button onClick={() => setIsOverLimit("")} className="hover:bg-rose-100 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {planCode && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium animate-fadeIn">
                  Plan: {planCode}
                  <button onClick={() => setPlanCode("")} className="hover:bg-indigo-100 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(minWalletBalance || maxWalletBalance) && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium animate-fadeIn">
                  Wallet: {minWalletBalance || '0'} - {maxWalletBalance || '∞'}
                  <button onClick={() => { setMinWalletBalance(""); setMaxWalletBalance(""); }} className="hover:bg-emerald-100 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Subscription Alerts */}
      {filteredRestaurants.some(r => r.subscription?.isOverLimit) && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 flex items-start gap-4">
          <div className="bg-rose-100 p-2 rounded-xl">
            <Zap className="w-6 h-6 text-rose-600 fill-rose-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-rose-900 font-bold text-sm sm:text-base">Subscription Limits Exceeded</h4>
            <p className="text-rose-700 text-xs sm:text-sm mt-0.5">
              {filteredRestaurants.filter(r => r.subscription?.isOverLimit).length} restaurants are currently over their plan limit and incurring additional charges.
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-rose-600 hover:bg-rose-100 text-xs font-bold uppercase tracking-wider h-auto py-2"
            onClick={() => setSearchTerm("")} // Or some other action
          >
            Review All
          </Button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
        <DataTable
          data={filteredRestaurants}
          isLoading={loading}
          total={total}
          page={page}
          limit={limit}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          columns={[
            {
              key: 'logo_url',
              label: '',
              width: '100px',
              render: (restaurant) => (
                <img
                  src={restaurant.logo || 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=100'}
                  alt={restaurant.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ),
            },
            {
              key: 'name',
              label: 'Restaurant',
              width: '15%',
              render: (restaurant) => (
                <div
                  onClick={() => handleViewRestaurant(restaurant.tenantId, restaurant.id)}
                  className="cursor-pointer group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{restaurant.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Click to view details</div>
                </div>
              ),
            },
            {
              key: 'subscription',
              label: 'Plan & Usage',
              width: '18%',
              render: (restaurant) => {
                const sub = restaurant.subscription;
                if (!sub) return <span className="text-gray-400">No Plan</span>;

                const limit = sub.orderLimit || 0;
                const completed = sub.completedOrders || 0;
                const percentage = limit > 0 ? Math.min((completed / limit) * 100, 100) : 0;
                const isOver = sub.isOverLimit;

                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 px-2 py-0.5 bg-gray-100 rounded-full">{sub.planName}</span>
                      {isOver && (
                        <span className="flex items-center gap-0.5 text-[10px] font-black text-rose-600 uppercase">
                          <Zap className="w-3 h-3 fill-rose-600" /> Over Limit
                        </span>
                      )}
                    </div>
                    {limit > 0 && (
                      <div className="space-y-1">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${isOver ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-indigo-500'
                              }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-medium">
                          <span className={isOver ? 'text-rose-600 font-bold' : 'text-gray-500'}>
                            {completed.toLocaleString()} / {limit.toLocaleString()} orders
                          </span>
                          {isOver && (
                            <span className="text-rose-600 font-bold">
                              +{sub.overageCount} excess
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {!limit && <span className="text-[10px] text-gray-500 font-medium">Unlimited Orders</span>}
                  </div>
                )
              },
            },
            {
              key: 'tenant',
              label: 'Tenant',
              render: (restaurant) => {
                const tenant = tenants.find((tenant) => tenant.id === restaurant.tenantId);
                return (
                  <div>{tenant?.name ?? "N/A"}</div>
                )
              },
            },
            {
              key: 'wallet',
              label: 'Wallet & Fees',
              width: '15%',
              render: (restaurant) => {
                const balance = restaurant.walletBalance || 0;
                const additionalCharges = restaurant.subscription?.additionalCharges || 0;
                return (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-emerald-50 rounded text-emerald-600">
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        NZD {balance.toLocaleString()}
                      </span>
                    </div>
                    {additionalCharges > 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full w-fit">
                        <ArrowUpRight className="w-3 h-3" />
                        Overage: NZD {additionalCharges.toLocaleString()}
                      </div>
                    )}
                  </div>
                )
              },
            },
            {
              key: 'city',
              label: 'City',
              render: (restaurant) => {
                if (!restaurant.address) {
                  return (
                    <div>N/A</div>
                  )
                }
                return (
                  <div>{restaurant.address.city}</div>
                )
              },
            },
            {
              key: 'district',
              label: 'District',
              render: (restaurant) => {
                if (!restaurant.address) {
                  return (
                    <div>N/A</div>
                  )
                }
                return (
                  <div>{restaurant.address.district}</div>
                )
              },
            },
            {
              key: 'status',
              label: 'Status',
              render: (restaurant) => (
                <StatusBadge
                  status={restaurant.isActive ? 'active' : 'inactive'}
                  type="subscription"
                />
              ),
            },
            {
              key: 'created_at',
              label: 'Joined',
              render: (restaurant) => (
                <span className="text-sm text-gray-600">
                  {new Date(restaurant.auditCreatedDateTime ?? "").toLocaleDateString()}
                </span>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              width: '130px',
              render: (restaurant) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewRestaurant(restaurant.tenantId, restaurant.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(restaurant)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:scale-110"
                    title="Edit Restaurant"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(restaurant)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                    title="Delete Restaurant"
                  >
                    {restaurant.isActive ? (
                      <Trash2 className="w-4 h-4" color="#dc2626" />
                    ) : (
                      <CheckCircle2
                        className="w-5 h-5"
                        color="white"
                        fill="#22c55e"
                      />
                    )}
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>



      {/* Edit Restaurant Modal */}
      {selectedRestaurant && (
        <EditRestaurantModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleEditRestaurant}
          restaurant={selectedRestaurant}
          loading={loading || imageLoading}
          onImageUpload={handleImageUpload}
        />
      )}

      {/* Add Restaurant Modal */}
      {!selectedRestaurant && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={'Add Restaurant'}
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button isLoading={imageLoading} onClick={handleSubmit(handleCreateRestaurant)} disabled={isTenantHasRestaurant || isDisable}>
                Create Restaurant
              </Button>
            </div>
          }
        >
          <RestaurantModelSection
            register={register}
            watch={watch}
            control={control}
            handleImageUpload={handleImageUpload}
            filterTenant={filterTenant}
            isTenantHasRestaurant={isTenantHasRestaurant}
            isPhoneNumberValid={isPhoneNumberValid}
          />
        </Modal>
      )}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        title={'Delete Restaurant'}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant='danger' onClick={handleDeleteConfirm} isLoading={loading}
              style={{
                backgroundColor:
                  selectedRestaurant?.isActive
                    ? "#dc2626"
                    : "#0daa2a",
              }}>
              {selectedRestaurant?.isActive
                ? "Deactivate"
                : "Reactivate"}
            </Button>
          </div>
        }
      >
        <div>
          Are you sure you want to{" "}
          {selectedRestaurant?.isActive
            ? "deactivate"
            : "reactivate"}{" "}
          this restaurant?
        </div>

      </Modal>
    </div >
  );
};
