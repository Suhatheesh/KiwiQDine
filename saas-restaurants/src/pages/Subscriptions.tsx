import { useState, useLayoutEffect } from 'react';
import { Plus, Zap, Filter, X, Search, LayoutGrid } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { archiveSubscriptionRequest, createSubscriptionRequest, fetchSubscriptionRequest, unarchiveSubscriptionRequest, updateSubscriptionRequest, deleteSubscriptionRequest, createSpecialSubscriptionRequest } from '../features/subscriptions/subscriptionsSlice';
import { BillingCycle, SubscriptionPlanType } from '../utils/constants';
import { CreateSubscriptionPlan, SubscriptionPlan } from '../features/subscriptions/types';
import { SubmitHandler, useForm } from 'react-hook-form';
import { SubscriptionCardSkeleton } from '../components/CustomSkeleton';
import SubscriptionModelSection from '../sections/Model/Subscription/SubscriptionModelSection';
import { ConfirmationModal } from '../components/ConfirmationModal';
import SubscriptionCard from '../components/SubscriptionCard';
import { fetchTenantMinimalListRequest } from '../features/tenants/tenantsSlice';

export const Subscriptions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [featureInput, setFeatureInput] = useState<{ id: number, value: string }[]>([])
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'archive' | 'unarchive' | 'delete';
    planId: string | null;
    planName: string;
  }>({
    isOpen: false,
    type: 'archive',
    planId: null,
    planName: ''
  });
  const [tenantSearchTerm, setTenantSearchTerm] = useState('');

  // Filter States
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [isSpecializedFilter, setIsSpecializedFilter] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tenantNameSearch, setTenantNameSearch] = useState("");

  const dispatch = useDispatch<AppDispatch>();

  const { plans, isCreatePlan, loading } = useSelector((state: RootState) => state.subscriptions);
  const { tenantMinimalList } = useSelector((state: RootState) => state.tenants);

  const { register, handleSubmit, reset, watch, setValue } = useForm<CreateSubscriptionPlan>({
    defaultValues: {
      name: "",
      description: "",
      priceMonthly: 0,
      overageChargePerInvoice: 0,
      overageChargePerUser: 0,
      orderLimit: 0,
      billingCycle: BillingCycle.MONTHLY,
      features: [],
      isSpecializedPlan: false,
      tenantIds: [],
      code: "",
      order: 1,
      status: "active",
      yearlySavingsPercent: 0,
      tableLimit: 0,
      overageChargePerQR: 0,
      overageChargePerTable: 0
    },
  });

  const {
    name,
    description,
    priceMonthly,
    orderLimit,
    tableLimit,
    overageChargePerQR,
    overageChargePerTable,
    qrLimit,
    userLimit,
  } = watch();

  useLayoutEffect(() => {
    dispatch(fetchSubscriptionRequest({
      includeArchived: includeArchived,
      isSpecializedPlan: isSpecializedFilter,
      planName: searchTerm,
      tenantName: tenantNameSearch
    }))
  }, [dispatch, includeArchived, isSpecializedFilter, searchTerm, tenantNameSearch])

  useLayoutEffect(() => {
    dispatch(fetchTenantMinimalListRequest(tenantSearchTerm))
  }, [dispatch, tenantSearchTerm])

  useLayoutEffect(() => {
    if (isCreatePlan) {
      handleCloseModal();
    }
  }, [isCreatePlan])

  const handleClearFilters = () => {
    setIncludeArchived(false);
    setIsSpecializedFilter(false);
    setSearchTerm("");
    setTenantNameSearch("");
  };

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedPlan(null);
    setIsModalOpen(true);
    reset({
      name: "",
      description: "",
      billingCycle: BillingCycle.MONTHLY,
      features: [],
      isSpecializedPlan: false,
      tenantIds: [],
      code: "",
      order: 0,
      status: "active",
    })
    setFeatureInput([])
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const getPlanStats = (planId: string) => {
    const activeSubscriptions = plans.filter(
      (s) => s.id === planId && s.status === 'active'
    );
    return {
      count: activeSubscriptions.length,
      revenue: activeSubscriptions.length * plans.find((p) => p.id === planId)!.priceMonthly,
    };
  };

  const generateFeatureInput = () => {
    setFeatureInput((prev) => {
      const newId = prev.length <= 0 ? 1 : prev[prev.length - 1].id + 1;
      return [...prev, { id: newId, value: "" }]
    });
  }

  const addFeature = (id: number, value: string) => {
    setFeatureInput((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, value } : item
      )
    );
  };

  const removeFeature = (index: number) => setFeatureInput((prev) => prev.filter((_, i) => i !== index));

  const handleAddPlan: SubmitHandler<CreateSubscriptionPlan> = (data) => {
    const request: CreateSubscriptionPlan = {
      ...data,
      code: data.name.split(" ").join("_").toLowerCase(),
      features: featureInput.map((i) => i.value)
    }
    if (selectedPlan) {
      dispatch(updateSubscriptionRequest(request))
    } else if (data.isSpecializedPlan) {
      dispatch(createSpecialSubscriptionRequest(request))
    } else {
      dispatch(createSubscriptionRequest(request))
    }
    handleCloseModal();
  }

  const handleEdit = (plan: SubscriptionPlan) => {
    setIsModalOpen(true);
    setSelectedPlan(plan);
    reset({
      ...plan,
    })
    setFeatureInput(plan.features.map((i, index) => ({ id: index + 1, value: i })))
  }

  const handleArchive = (planId: string, planName: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'archive',
      planId,
      planName
    });
  };

  const handleUnarchive = (planId: string, planName: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'unarchive',
      planId,
      planName
    });
  };

  const handleDelete = (planId: string, planName: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      planId,
      planName
    });
  };

  const handleConfirmAction = () => {
    if (confirmModal.planId) {
      if (confirmModal.type === 'archive') {
        dispatch(archiveSubscriptionRequest(confirmModal.planId));
      } else if (confirmModal.type === 'unarchive') {
        dispatch(unarchiveSubscriptionRequest(confirmModal.planId));
      } else {
        dispatch(deleteSubscriptionRequest(confirmModal.planId));
      }
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const isEmpty = (value: unknown) =>
    value === '' || value === null || value === undefined;

  const isButtonDisabled = isEmpty(name) || isEmpty(description) || isEmpty(priceMonthly) || isEmpty(orderLimit) || (isEmpty(tableLimit) && isEmpty(tableLimit)) || (isEmpty(overageChargePerQR) && isEmpty(overageChargePerQR)) || (isEmpty(overageChargePerTable) && isEmpty(overageChargePerTable)) || (isEmpty(qrLimit) && isEmpty(qrLimit)) || (isEmpty(userLimit) && isEmpty(userLimit));

  return (
    <div className="space-y-8 p-6 min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 mb-2">
            Subscription Plans
          </h1>
          <p className="text-gray-500 font-medium">Manage your pricing tiers and feature sets</p>
        </div>
        <Button onClick={handleAdd} className="shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
          <Plus className="w-5 h-5 mr-2" />
          Create New Plan
        </Button>
      </div>

      {/* Modern Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filter Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <p className="text-sm text-gray-500">Refine your subscription plans view</p>
              </div>
            </div>
            {(includeArchived || isSpecializedFilter || searchTerm || tenantNameSearch) && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            {/* Search Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Plan name, code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-[11px] bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {/* Tenant Name Search Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Tenant Name</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Tenant name..."
                  value={tenantNameSearch}
                  onChange={(e) => setTenantNameSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-[11px] bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {/* Specialized Plan Toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Plan Type</label>
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setIsSpecializedFilter(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${!isSpecializedFilter ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  General
                </button>
                <button
                  onClick={() => setIsSpecializedFilter(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${isSpecializedFilter ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Search className="w-4 h-4" />
                  Specialized
                </button>
              </div>
            </div>

            {/* Archived Toggle */}
            <div className="flex flex-col gap-1.5 h-full justify-end pb-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">Include Archived</span>
              </label>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(searchTerm || tenantNameSearch || includeArchived || isSpecializedFilter) && (
          <div className="px-6 pb-4 flex flex-wrap gap-2">
            <span className="text-xs font-medium text-gray-500 py-1.5">Active Filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm("")} className="hover:bg-blue-100 rounded p-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}
            {tenantNameSearch && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                Tenant: {tenantNameSearch}
                <button onClick={() => setTenantNameSearch("")} className="hover:bg-indigo-100 rounded p-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}
            {isSpecializedFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                Specialized Only
                <button onClick={() => setIsSpecializedFilter(false)} className="hover:bg-purple-100 rounded p-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}
            {includeArchived && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium">
                Including Archived
                <button onClick={() => setIncludeArchived(false)} className="hover:bg-orange-100 rounded p-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <SubscriptionCardSkeleton key={i} />
            ))}
          </>
        ) : filteredPlans.length > 0 ? (
          <>
            {filteredPlans.map((plan) => {
              const stats = getPlanStats(plan.id!);
              const isPopular = plan.code === SubscriptionPlanType.DINE_SOON_PRO;
              const isArchived = plan.isArchived;

              return (
                <SubscriptionCard
                  key={plan.id}
                  plan={plan}
                  isPopular={isPopular}
                  isArchived={isArchived}
                  stats={stats}
                  handleArchive={handleArchive}
                  handleUnarchive={handleUnarchive}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              );
            })}
          </>
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-300 animate-fadeIn">
            <div className="p-4 bg-gray-50 rounded-2xl mb-4 text-gray-400">
              <Zap className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              No plans found
            </h3>
            <p className="text-gray-500 max-w-xs text-center">
              You haven't created any subscription plans yet. Click the button above to get started.
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={handleCloseModal} className="hover:bg-gray-100">
              Cancel
            </Button>
            <Button onClick={handleSubmit(handleAddPlan)} isLoading={loading} disabled={isButtonDisabled} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
              {selectedPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        }
      >
        <SubscriptionModelSection
          register={register}
          featureInput={featureInput}
          addFeature={addFeature}
          removeFeature={removeFeature}
          generateFeatureInput={generateFeatureInput}
          tenants={tenantMinimalList}
          watch={watch}
          setValue={setValue}
          onSearchTenant={setTenantSearchTerm}
        />
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={confirmModal.type === 'archive' ? 'Archive Plan' : confirmModal.type === 'unarchive' ? 'Unarchive Plan' : 'Delete Plan'}
        description={
          confirmModal.type === 'archive'
            ? `Are you sure you want to archive the "${confirmModal.planName}" plan? This will hide it from new subscribers.`
            : confirmModal.type === 'unarchive'
              ? `Are you sure you want to unarchive the "${confirmModal.planName}" plan? It will become visible for new subscribers again.`
              : `Are you sure you want to permanently delete the "${confirmModal.planName}" plan? This action cannot be undone.`
        }
        confirmText={confirmModal.type === 'archive' ? 'Archive Plan' : confirmModal.type === 'unarchive' ? 'Unarchive Plan' : 'Delete Plan'}
        type={confirmModal.type === 'unarchive' ? 'success' : 'danger'}
        isLoading={loading}
      />
    </div >
  );
};
