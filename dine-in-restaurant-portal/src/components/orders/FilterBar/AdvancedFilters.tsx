import { useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

export interface AdvancedFilterOption {
  label: string;
  value: string;
}

export interface AdvancedFiltersProps {
  orderTypes?: AdvancedFilterOption[];
  paymentTypes?: AdvancedFilterOption[];
  selectedOrderTypes?: string[];
  selectedPaymentTypes?: string[];
  dateRange?: { from?: string; to?: string };
  onOrderTypeChange?: (values: string[]) => void;
  onPaymentTypeChange?: (values: string[]) => void;
  onDateRangeChange?: (range: { from?: string; to?: string }) => void;
  className?: string;
}

export function AdvancedFilters({
  orderTypes = [],
  paymentTypes = [],
  selectedOrderTypes = [],
  selectedPaymentTypes = [],
  dateRange,
  onOrderTypeChange,
  onPaymentTypeChange,
  onDateRangeChange,
  className = '',
}: AdvancedFiltersProps) {
  const [showOrderTypes, setShowOrderTypes] = useState(false);
  const [showPaymentTypes, setShowPaymentTypes] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);

  const toggleOrderType = (value: string) => {
    const newSelection = selectedOrderTypes.includes(value)
      ? selectedOrderTypes.filter((v) => v !== value)
      : [...selectedOrderTypes, value];
    onOrderTypeChange?.(newSelection);
  };

  const togglePaymentType = (value: string) => {
    const newSelection = selectedPaymentTypes.includes(value)
      ? selectedPaymentTypes.filter((v) => v !== value)
      : [...selectedPaymentTypes, value];
    onPaymentTypeChange?.(newSelection);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-sm font-medium text-gray-700">Advanced Filters</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Order Type Filter */}
        {orderTypes.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowOrderTypes(!showOrderTypes)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors"
            >
              <span className="text-gray-700">
                Order Type
                {selectedOrderTypes.length > 0 && (
                  <span className="ml-2 text-primary-600 font-medium">
                    ({selectedOrderTypes.length})
                  </span>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showOrderTypes ? 'rotate-180' : ''}`} />
            </button>

            {showOrderTypes && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-2 space-y-1">
                  {orderTypes.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center px-3 py-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrderTypes.includes(option.value)}
                        onChange={() => toggleOrderType(option.value)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Type Filter */}
        {paymentTypes.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowPaymentTypes(!showPaymentTypes)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors"
            >
              <span className="text-gray-700">
                Payment Type
                {selectedPaymentTypes.length > 0 && (
                  <span className="ml-2 text-primary-600 font-medium">
                    ({selectedPaymentTypes.length})
                  </span>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showPaymentTypes ? 'rotate-180' : ''}`} />
            </button>

            {showPaymentTypes && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-2 space-y-1">
                  {paymentTypes.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center px-3 py-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPaymentTypes.includes(option.value)}
                        onChange={() => togglePaymentType(option.value)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date Range Filter */}
        <div className="relative">
          <button
            onClick={() => setShowDateRange(!showDateRange)}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors"
          >
            <span className="flex items-center text-gray-700">
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDateRange ? 'rotate-180' : ''}`} />
          </button>

          {showDateRange && (
            <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateRange?.from || ''}
                    onChange={(e) =>
                      onDateRangeChange?.({ ...dateRange, from: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateRange?.to || ''}
                    onChange={(e) =>
                      onDateRangeChange?.({ ...dateRange, to: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
