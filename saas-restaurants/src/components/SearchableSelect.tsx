import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    label?: string;
    error?: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const SearchableSelect = ({
    label,
    error,
    options,
    value,
    onChange,
    placeholder = "Search...",
    className = '',
    disabled = false
}: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = useMemo(() =>
        options.find(opt => opt.value === value),
        [options, value]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
        }
    };

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
    };

    return (
        <div className={`w-full relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}

            <div
                onClick={handleToggle}
                className={`w-full px-4 py-2 border rounded-lg text-sm cursor-pointer flex items-center justify-between transition-all ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-75' :
                        error ? 'border-red-300 bg-red-50' :
                            'border-gray-300 bg-white hover:border-gray-400'
                    } ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
            >
                <span className={`truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="flex items-center gap-2">
                    {value && !disabled && (
                        <X
                            className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                            onClick={handleClear}
                        />
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl animate-fadeIn overflow-hidden">
                    <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Filter results..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') setIsOpen(false);
                                }}
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto pt-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`px-4 py-2 text-sm cursor-pointer transition-colors ${option.value === value
                                            ? 'bg-blue-50 text-blue-700 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {option.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No results found for "{searchTerm}"
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        </div>
    );
};
