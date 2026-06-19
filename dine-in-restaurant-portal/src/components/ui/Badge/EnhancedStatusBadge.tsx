import { Clock, CheckCircle, AlertCircle, XCircle, Pause, Flame, Package } from 'lucide-react';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'hold'
  | 'cancelled';

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

export type BadgeSize = 'sm' | 'md' | 'lg';

interface EnhancedStatusBadgeProps {
  status: OrderStatus | PaymentStatus | string;
  type?: 'order' | 'payment' | 'default';
  size?: BadgeSize;
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClasses: string;
  dotColor?: string;
  animated?: boolean;
}

const orderStatusConfig: Record<string, StatusConfig> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    colorClasses: 'bg-amber-500/10 text-amber-700 border-amber-400/30',
    dotColor: 'bg-amber-500',
    animated: true,
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    colorClasses: 'bg-blue-500/10 text-blue-700 border-blue-400/30',
  },
  preparing: {
    label: 'Preparing',
    icon: Flame,
    colorClasses: 'bg-violet-500/10 text-violet-700 border-violet-400/30',
    animated: true,
  },
  ready: {
    label: 'Ready',
    icon: Package,
    colorClasses: 'bg-emerald-500/10 text-emerald-700 border-emerald-400/30',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    colorClasses: 'bg-slate-500/10 text-slate-700 border-slate-400/30',
  },
  hold: {
    label: 'Hold',
    icon: Pause,
    colorClasses: 'bg-orange-500/10 text-orange-700 border-orange-400/30',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    colorClasses: 'bg-rose-500/10 text-rose-700 border-rose-400/30',
  },
};

const paymentStatusConfig: Record<string, StatusConfig> = {
  paid: {
    label: 'Paid',
    icon: CheckCircle,
    colorClasses: 'bg-emerald-500/10 text-emerald-700 border-emerald-400/30',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    colorClasses: 'bg-amber-500/10 text-amber-700 border-amber-400/30',
    dotColor: 'bg-amber-500',
    animated: true,
  },
  overdue: {
    label: 'Overdue',
    icon: AlertCircle,
    colorClasses: 'bg-rose-500/10 text-rose-700 border-rose-400/30',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    colorClasses: 'bg-slate-500/10 text-slate-700 border-slate-400/30',
  },
};

const defaultConfig: StatusConfig = {
  label: '',
  icon: AlertCircle,
  colorClasses: 'bg-slate-500/10 text-slate-700 border-slate-400/30',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

const iconSizes = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
};

export function EnhancedStatusBadge({
  status,
  type = 'order',
  size = 'md',
  showIcon = true,
  animated = true,
  className = '',
}: EnhancedStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  // Get config based on type
  let config: StatusConfig;
  if (type === 'order') {
    config = orderStatusConfig[normalizedStatus] || defaultConfig;
  } else if (type === 'payment') {
    config = paymentStatusConfig[normalizedStatus] || defaultConfig;
  } else {
    // Default type - try both configs
    config = orderStatusConfig[normalizedStatus] || paymentStatusConfig[normalizedStatus] || defaultConfig;
  }

  const Icon = config.icon;
  const displayLabel = config.label || status.charAt(0).toUpperCase() + status.slice(1);
  const shouldAnimate = animated && config.animated;

  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold border ${config.colorClasses} ${sizeClasses[size]} ${className} transition-all duration-200 hover:scale-105`}
    >
      {/* Icon */}
      {showIcon && (
        <Icon
          className={`${iconSizes[size]} ${
            shouldAnimate && config.icon === Flame ? 'animate-pulse' : ''
          }`}
        />
      )}

      {/* Label */}
      <span className="whitespace-nowrap font-bold tracking-tight">{displayLabel}</span>

      {/* Pulsing dot for animated statuses */}
      {shouldAnimate && config.dotColor && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotColor} opacity-75`}
          />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dotColor}`} />
        </span>
      )}
    </span>
  );
}

// Helper function to get status variant color for custom uses
export function getStatusColor(status: string, type: 'order' | 'payment' = 'order') {
  const normalizedStatus = status.toLowerCase();
  const config = type === 'order'
    ? orderStatusConfig[normalizedStatus]
    : paymentStatusConfig[normalizedStatus];

  if (!config) return 'gray';

  // Extract base color from colorClasses
  if (config.colorClasses.includes('emerald')) return 'emerald';
  if (config.colorClasses.includes('blue')) return 'blue';
  if (config.colorClasses.includes('violet')) return 'violet';
  if (config.colorClasses.includes('amber')) return 'amber';
  if (config.colorClasses.includes('orange')) return 'orange';
  if (config.colorClasses.includes('rose')) return 'rose';
  if (config.colorClasses.includes('slate')) return 'slate';
  return 'slate';
}
