import { FC, useEffect, useRef, useState } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';

interface MultiSelectOption {
    value: string;
    label: string;
}

interface MultiSelectProps {
    label?: string;
    placeholder?: string;
    options: MultiSelectOption[];
    value: string[];
    onChange: (value: string[]) => void;
    onSearch?: (searchTerm: string) => void;
    error?: string;
    disabled?: boolean;
}

export const MultiSelect: FC<MultiSelectProps> = ({
    label,
    placeholder = "Select items...",
    options,
    value = [],
    onChange,
    onSearch,
    error,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const handleRemove = (e: React.MouseEvent, optionValue: string) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== optionValue));
    };

    const getSelectedLabel = (val: string) => {
        return options.find(o => o.value === val)?.label || val;
    };

    return (
        <div className="w-full relative" ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}

            <div
                className={`
                    w-full min-h-[42px] px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer relative
                    flex flex-wrap gap-2 items-center
                    ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent
                `}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {value.length === 0 && (
                    <span className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">
                        {placeholder}
                    </span>
                )}

                {value.map(val => (
                    <span
                        key={val}
                        className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md flex items-center gap-1 text-xs font-medium z-10"
                        onClick={(e) => e.stopPropagation()} // Prevent opening dropdown when clicking tag
                    >
                        {getSelectedLabel(val)}
                        <X
                            className="w-3 h-3 cursor-pointer hover:text-blue-900"
                            onClick={(e) => handleRemove(e, val)}
                        />
                    </span>
                ))}

                <div className="grow flex justify-end">
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}

            {/* Dropdown Menu */}
            {isOpen && !disabled && (
                <div className="w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    onSearch && onSearch(e.target.value)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const isSelected = value.includes(option.value);
                                return (
                                    <div
                                        key={option.value}
                                        className={`
                                            px-4 py-2 text-sm cursor-pointer flex items-center justify-between
                                            ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}
                                        `}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        <span>{option.label}</span>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No items found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
