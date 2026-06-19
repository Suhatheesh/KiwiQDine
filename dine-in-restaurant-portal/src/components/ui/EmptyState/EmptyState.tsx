import { ReactNode } from 'react';
import { Inbox, Search, ShoppingBag, FileText, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode | 'inbox' | 'search' | 'cart' | 'document' | 'alert';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const predefinedIcons = {
  inbox: Inbox,
  search: Search,
  cart: ShoppingBag,
  document: FileText,
  alert: AlertCircle,
};

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'py-8',
      iconWrapper: 'w-12 h-12',
      icon: 'w-6 h-6',
      title: 'text-sm',
      description: 'text-xs',
      button: 'px-3 py-1.5 text-sm',
    },
    md: {
      container: 'py-12',
      iconWrapper: 'w-16 h-16',
      icon: 'w-8 h-8',
      title: 'text-base',
      description: 'text-sm',
      button: 'px-4 py-2 text-sm',
    },
    lg: {
      container: 'py-16',
      iconWrapper: 'w-20 h-20',
      icon: 'w-10 h-10',
      title: 'text-lg',
      description: 'text-base',
      button: 'px-6 py-2.5 text-base',
    },
  };

  const config = sizeConfig[size];

  // Render icon
  let IconComponent: ReactNode;
  if (typeof icon === 'string' && icon in predefinedIcons) {
    const PredefinedIcon = predefinedIcons[icon as keyof typeof predefinedIcons];
    IconComponent = <PredefinedIcon className={`${config.icon} text-gray-400`} />;
  } else if (icon) {
    IconComponent = icon;
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center ${config.container} ${className}`}>
      {/* Icon */}
      {IconComponent && (
        <div className={`${config.iconWrapper} bg-gray-100 rounded-full flex items-center justify-center mb-4`}>
          {IconComponent}
        </div>
      )}

      {/* Title */}
      <h3 className={`${config.title} font-semibold text-gray-900 mb-1`}>{title}</h3>

      {/* Description */}
      {description && (
        <p className={`${config.description} text-gray-500 max-w-sm mb-6`}>{description}</p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={`${config.button} rounded-lg font-medium transition-all duration-200 ${
            action.variant === 'secondary'
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
