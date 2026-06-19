import { useLayoutEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Check, Shield, Zap, Star, PartyPopper } from 'lucide-react';
import { PlanStatus, SubscriptionPlanType } from '../utils/constants';
import { SubscriptionCardSkeleton } from '../components/CustomSkeleton';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { changePlanRequest, fetchSubscriptionRequest, fetchSubscriptionUsageRequest, resetState } from '../features/subscriptions/subscriptionsSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../app/store';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { SuccessShowcaseSection } from '../sections/Model/Subscription/SuccessShowcaseSection';
import confetti from 'canvas-confetti';
import { UpdateSubscriptionPlan } from '../features/subscriptions/types';

export const Subscriptions = () => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { plans, loading, currentPlanId } = useSelector((state: RootState) => state.subscription);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const location = useLocation();
  const initialPlanId = location.state?.currentPlanId as string | undefined;
  const [currentPlan, setCurrentPlan] = useState<string>(initialPlanId || '');
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false);

  useLayoutEffect(() => {
    if (!hasAutoSwitched && plans.length > 0 && currentPlan) {
      const activePlan = plans.find((p) => p.id === currentPlan);
      if (activePlan?.billingCycle) {
        setBillingCycle(activePlan.billingCycle.toLowerCase() as 'monthly' | 'yearly');
        setHasAutoSwitched(true);
      }
    }
  }, [plans, currentPlan, hasAutoSwitched]);

  // Success Showcase State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<any>(null);

  // Confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlanToChange, setSelectedPlanToChange] = useState<any>(null);

  useLayoutEffect(() => {
    dispatch(fetchSubscriptionRequest({ status: PlanStatus.ACTIVE, includeArchived: false }));
  }, [dispatch]);

  useLayoutEffect(() => {
    if (currentPlanId) {
      setUpgradingPlanId(null)
      setCurrentPlan(selectedPlanDetails?.id || '');
      setShowSuccessModal(true);
      triggerConfetti();
    }
    return () => {
      dispatch(resetState());
    }
  }, [currentPlanId])

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  // Cleanly handle plan upgrade
  const handleUpgradePlan = async (planCode: string) => {
    try {
      const plan = plans.find((p) => p.code === planCode);
      setUpgradingPlanId(plan?.id || null);
      if (!plan || !user?.restaurant?.id) throw new Error('Missing plan or restaurant info');

      const payload: UpdateSubscriptionPlan = {
        restaurantId: user.restaurant.id,
        newPlanId: plan.id || '',
        reason: 'Upgrade Plan',
        billingCycle: plan.billingCycle || '',
      };

      dispatch(changePlanRequest(payload));
      setSelectedPlanDetails(plan);
      dispatch(fetchSubscriptionUsageRequest(user.restaurant.id));
    } catch (err) {
      alert('Failed to upgrade plan. Please try again.');
    } finally {
      setUpgradingPlanId(null);
    }
  };

  return (
    <div className="space-y-8 p-6 min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-gray-900 to-gray-600 mb-2">
            Change Plan
          </h1>
          <p className="text-gray-500 font-medium">Change Your Subscription Plan</p>
        </div>
      </div>

      {/* Billing Cycle Tabs */}
      <div className="flex justify-center">
        <div className="bg-white p-1 rounded-2xl border border-gray-200 shadow-sm inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${billingCycle === 'monthly'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${billingCycle === 'yearly'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <SubscriptionCardSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            {plans
              .filter((plan) => plan.billingCycle?.toLowerCase() === billingCycle)
              .map((plan) => {
                const isPopular = plan.code === SubscriptionPlanType.PRO;
                const isCurrent = plan.id === currentPlan;

                const buttonLabel = isCurrent
                  ? 'Current Plan'
                  : 'Upgrade Plan'

                // Visual configurations based on plan type
                let Icon = Shield;
                let iconColor = 'text-blue-500';
                let iconBg = 'bg-blue-50';
                let borderColor = 'border-gray-200';

                if (plan.code === SubscriptionPlanType.PRO) {
                  Icon = Zap;
                  iconColor = 'text-yellow-500';
                  iconBg = 'bg-yellow-50';
                  borderColor = 'border-blue-500 ring-4 ring-blue-500/10';
                } else if (plan.code === SubscriptionPlanType.PREMIUM) {
                  Icon = Star;
                  iconColor = 'text-purple-500';
                  iconBg = 'bg-purple-50';
                }

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-3xl p-6 border transition-all duration-300 hover:shadow-xl flex flex-col ${isPopular ? borderColor : 'border-gray-200'}`}
                  >
                    {/* Most Popular Badge */}
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                        <Zap className="w-3 h-3 fill-current" />
                        Most Popular
                      </div>
                    )}

                    {/* Icon & Header */}
                    <div className="mb-6">
                      <div className={`w-14 h-14 ${iconBg} ${iconColor} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-8">
                      <div className="flex items-end gap-1 mb-2">
                        <span className="text-4xl font-extrabold text-gray-900">USD {plan.priceMonthly}</span>
                        <span className="text-gray-500 font-medium mb-1">/mo</span>
                      </div>
                      <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold">
                        Save 17% yearly
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8 flex-1">
                      {plan.features.slice(0, 5).map((feature: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 group">
                          <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                          </div>
                          <span className="text-gray-600 text-sm group-hover:text-gray-900 transition-colors">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Button
                      className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 mb-6 ${isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5'
                        } ${upgradingPlanId === plan.id ? 'opacity-70 cursor-wait' : ''}`}
                      disabled={isCurrent || upgradingPlanId === plan.id}
                      onClick={() => {
                        if (!isCurrent) {
                          setSelectedPlanToChange(plan);
                          setShowConfirmModal(true);
                        }
                      }}
                    >
                      {upgradingPlanId === plan.id ? 'Processing...' : buttonLabel}
                    </Button>
                  </div>
                );
              })}
          </>
        )}
      </div>

      {/* Success Showcase Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <PartyPopper className="w-6 h-6 text-green-600 animate-bounce" />
            </div>
            <span>Plan Successfully {selectedPlanDetails && (selectedPlanDetails.code === SubscriptionPlanType.PRO || selectedPlanDetails.code === SubscriptionPlanType.PREMIUM) ? 'Upgraded' : 'Downgraded'}!</span>
          </div>
        }
        size="md"
      >
        {selectedPlanDetails && (
          <SuccessShowcaseSection
            plan={selectedPlanDetails}
            onClose={() => setShowSuccessModal(false)}
          />
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${selectedPlanToChange && (plans.find(p => p.code === currentPlan)?.order || 0) < selectedPlanToChange.order ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
              <Shield className="w-6 h-6" />
            </div>
            <span>Confirm Plan Change</span>
          </div>
        }
        size="md"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button
              className="px-6 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              className={`px-6 py-2 text-white ${selectedPlanToChange && (plans.find(p => p.code === currentPlan)?.order || 0) < selectedPlanToChange.order ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              onClick={() => {
                if (selectedPlanToChange) {
                  handleUpgradePlan(selectedPlanToChange.code);
                  setShowConfirmModal(false);
                }
              }}
            >
              Confirm Upgrade
            </Button>
          </div>
        }
      >
        {selectedPlanToChange && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-500 font-medium">New Plan</p>
                  <p className="text-xl font-bold text-gray-900">{selectedPlanToChange.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium">Billing Period</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{selectedPlanToChange.billingCycle}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Amount</p>
                  <p className="text-2xl font-extrabold text-blue-600">USD {selectedPlanToChange.priceMonthly}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 italic">Effective immediately</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed px-1">
              Are you sure you want to change your subscription to the <span className="font-bold text-gray-900">{selectedPlanToChange.name}</span> plan? This will update your restaurant's access level and billing accordingly.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
