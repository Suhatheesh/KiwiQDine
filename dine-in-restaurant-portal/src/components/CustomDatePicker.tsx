import { FC, useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { hexToRgba } from '../utils';
import { Button } from './Button';

interface CustomDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
    label?: string;
}

export const CustomDatePicker: FC<CustomDatePickerProps> = ({
    value,
    onChange,
    placeholder = 'Select date',
    label
}) => {
    const { primaryColor } = useAuth();
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div
                onClick={() => setIsOpen(!isOpen)}
                onFocus={(e) => (e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`)}
                onBlur={(e) => (e.target.style.boxShadow = "none")}
                className="relative flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer focus:border-transparent transition-all bg-white"
            >
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className={`flex-1 text-sm ${value ? 'text-gray-800' : 'text-gray-400'}`}>
                    {displayValue || placeholder}
                </span>
            </div>

            {isOpen && (
                <div style={{ border: `1px solid ${primaryColor}` }} className="absolute w-60 z-50 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div style={{ backgroundColor: hexToRgba(primaryColor, 0.9) }} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handlePreviousMonth}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-white" />
                            </button>
                            <div className="text-center">
                                <h3 className="text-white font-bold text-lg">
                                    {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                </h3>
                            </div>
                            <button
                                onClick={handleNextMonth}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="p-4">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {daysOfWeek.map((day) => (
                                <div
                                    key={day}
                                    className="text-center text-xs font-semibold text-gray-600 py-2"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, index) => (
                                <div key={index} className="aspect-square">
                                    {day ? (
                                        <button
                                            onClick={() => handleDateClick(day)}
                                            className={`w-full h-full flex items-center justify-center text-sm font-medium rounded-lg transition-all
                                                ${isSelected(day)
                                                    ? 'bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-md scale-105'
                                                    : isToday(day)
                                                        ? 'bg-orange-100 text-orange-700 border-2 border-orange-400'
                                                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                                }
                                            `}
                                        >
                                            {day}
                                        </button>
                                    ) : (
                                        <div />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                        <Button
                            onClick={handleToday}
                            className="w-full py-2 px-4"
                        >
                            Today
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
