export type PlanTier = 'basic' | 'pro' | 'premium' | 'enterprise';

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    tier: PlanTier;
    features: string[];
    monthly_price: number;
    yearly_price: number;
    trial_days: number;
    max_tables: number | null;
    max_menu_items: number | null;
    max_staff: number | null;
    is_active: boolean;
    created_at: string;
}

const getDateString = (daysOffset: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString();
};

export const mockSubscriptionPlans: SubscriptionPlan[] = [
    {
        id: 'plan-1',
        name: 'Basic',
        description: 'Perfect for small cafes and food trucks',
        tier: 'basic',
        features: ['Up to 10 tables', 'Up to 50 menu items', '2 staff accounts', 'Basic QR codes', 'Email support'],
        monthly_price: 29.99,
        yearly_price: 299.99,
        trial_days: 14,
        max_tables: 10,
        max_menu_items: 50,
        max_staff: 2,
        is_active: true,
        created_at: getDateString(-90),
    },
    {
        id: 'plan-2',
        name: 'Pro',
        description: 'Ideal for growing restaurants',
        tier: 'pro',
        features: ['Up to 30 tables', 'Up to 200 menu items', '10 staff accounts', 'Advanced QR codes', 'Priority support', 'Analytics dashboard'],
        monthly_price: 79.99,
        yearly_price: 799.99,
        trial_days: 14,
        max_tables: 30,
        max_menu_items: 200,
        max_staff: 10,
        is_active: true,
        created_at: getDateString(-90),
    },
    {
        id: 'plan-3',
        name: 'Premium',
        description: 'For established restaurant chains',
        tier: 'premium',
        features: ['Unlimited tables', 'Unlimited menu items', 'Unlimited staff', 'Custom branding', '24/7 support', 'Advanced analytics', 'Multi-location support'],
        monthly_price: 199.99,
        yearly_price: 1999.99,
        trial_days: 30,
        max_tables: null,
        max_menu_items: null,
        max_staff: null,
        is_active: true,
        created_at: getDateString(-90),
    },
    {
        id: 'plan-4',
        name: 'Enterprise',
        description: 'Custom solution for large organizations',
        tier: 'enterprise',
        features: ['Everything in Premium', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', 'White-label option', 'API access'],
        monthly_price: 499.99,
        yearly_price: 4999.99,
        trial_days: 30,
        max_tables: null,
        max_menu_items: null,
        max_staff: null,
        is_active: true,
        created_at: getDateString(-90),
    },
];