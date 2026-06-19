import { MinusCircle, PlusCircle } from 'lucide-react';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isAddButton?: boolean;
  showButton?: boolean;
  onRemove?: () => void;
  onAdd?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, isAddButton = false, showButton = false, onAdd, onRemove, className = '', ...props }, ref) => {
    return (
      <div className="w-full relative">
        {label ? (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        ) : <div className='mb-6.5' />}
        <div className='flex items-center mb-1.5 justify-between'>
          <input
            ref={ref}
            className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
              } ${className}`}
            {...props}
          />
          {showButton && (
            <>
              {isAddButton ? (
                <PlusCircle onClick={onAdd} className='absolute cursor-pointer right-2 w-4' color='#1D4ED8' />
              ) : (
                <MinusCircle onClick={onRemove} className='absolute cursor-pointer right-2 w-4' color='#1D4ED8' />
              )
              }
            </>
          )}

        </div>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
