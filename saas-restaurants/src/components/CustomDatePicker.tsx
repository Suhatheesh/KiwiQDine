import { FC, useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from './Button';

interface CustomDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
}

export const CustomDatePicker: FC<CustomDatePickerProps> = ({
    value,
    onChange,
    placeholder = 'Select date',
    label,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseDate = (dateString: string): Date | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    };

    const handleDateClick = (day: number) => {
        const selectedDate = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );
        onChange(formatDate(selectedDate));
        setIsOpen(false);
    };

    const handlePreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        onChange(formatDate(today));
        setIsOpen(false);
    };

    const isToday = (day: number): boolean => {
        const today = new Date();
        return today.getFullYear() === currentMonth.getFullYear() &&
            today.getMonth() === currentMonth.getMonth() &&
            today.getDate() === day;
    };

    const isSelected = (day: number): boolean => {
        const selectedDate = parseDate(value);
        if (!selectedDate) return false;
        return selectedDate.getFullYear() === currentMonth.getFullYear() &&
            selectedDate.getMonth() === currentMonth.getMonth() &&
            selectedDate.getDate() === day;
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    const displayValue = value ? parseDate(value)?.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : '';

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`group relative flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 shadow-sm
                    ${disabled
                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-amber-400 hover:shadow-md cursor-pointer active:scale-[0.98]'
                    }
                    ${isOpen ? 'ring-2 ring-amber-500/20 border-amber-500 shadow-lg' : ''}
                `}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-500'}`}>
                        <Calendar className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-medium transition-colors ${value ? (disabled ? 'text-gray-400' : 'text-gray-900') : 'text-gray-400'}`}>
                        {displayValue || placeholder}
                    </span>
                </div>
                {!disabled && <Clock className={`w-3.5 h-3.5 transition-all duration-300 ${isOpen ? 'text-amber-500 rotate-180' : 'text-gray-300'}`} />}
            </div>

            {isOpen && (
                <div className="absolute top-full right-0 mt-3 min-w-[300px] z-[100] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
                        <div className="flex items-center justify-between text-white">
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePreviousMonth(); }}
                                className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2">
                                    <select
                                        value={currentMonth.getMonth()}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1));
                                        }}
                                        className="bg-transparent text-white font-bold text-lg tracking-tight focus:outline-none cursor-pointer hover:bg-white/10 rounded-lg px-2 transition-colors appearance-none"
                                        style={{ colorScheme: 'dark' }}
                                    >
                                        {months.map((month, index) => (
                                            <option key={month} value={index} className="text-gray-900 bg-white">
                                                {month}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={currentMonth.getFullYear()}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            setCurrentMonth(new Date(parseInt(e.target.value), currentMonth.getMonth(), 1));
                                        }}
                                        className="bg-transparent text-white/80 text-xs font-semibold uppercase tracking-widest focus:outline-none cursor-pointer hover:bg-white/10 rounded-lg px-2 transition-colors appearance-none"
                                        style={{ colorScheme: 'dark' }}
                                    >
                                        {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() + i - 5).map(year => (
                                            <option key={year} value={year} className="text-gray-900 bg-white">
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] leading-none">
                                    Quick Select
                                </p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNextMonth(); }}
                                className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="p-5">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-4">
                            {daysOfWeek.map((day) => (
                                <div
                                    key={day}
                                    className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, index) => (
                                <div key={index} className="aspect-square relative flex items-center justify-center">
                                    {day ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDateClick(day); }}
                                            className={`relative w-9 h-9 flex items-center justify-center text-sm font-bold rounded-xl transition-all duration-200
                                                ${isSelected(day)
                                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 scale-110 z-10'
                                                    : isToday(day)
                                                        ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-amber-600 hover:scale-110'
                                                }
                                            `}
                                        >
                                            {day}
                                            {isToday(day) && !isSelected(day) && (
                                                <span className="absolute bottom-1 w-1 h-1 bg-amber-500 rounded-full"></span>
                                            )}
                                        </button>
                                    ) : (
                                        <div />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleToday(); }}
                            className="text-amber-600 text-xs font-bold uppercase tracking-widest hover:text-amber-700 transition-colors"
                        >
                            Select Today
                        </button>
                        <Button
                            size="sm"
                            className="bg-white border-gray-200 text-gray-600 hover:bg-gray-100 px-4 py-1.5 rounded-lg text-xs font-bold"
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
