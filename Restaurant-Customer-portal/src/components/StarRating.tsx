import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    onRatingChange: (rating: number) => void;
    size?: 'sm' | 'md' | 'lg';
    readonly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
    rating,
    onRatingChange,
    size = 'md',
    readonly = false
}) => {
    const [hoverRating, setHoverRating] = useState(0);

    const sizes = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    const handleClick = (value: number) => {
        if (!readonly) {
            onRatingChange(value);
        }
    };

    const handleMouseEnter = (value: number) => {
        if (!readonly) {
            setHoverRating(value);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly) {
            setHoverRating(0);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => {
                const isFilled = value <= (hoverRating || rating);

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => handleClick(value)}
                        onMouseEnter={() => handleMouseEnter(value)}
                        onMouseLeave={handleMouseLeave}
                        disabled={readonly}
                        className={`
                            transition-all duration-200 transform
                            ${!readonly ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                            ${isFilled ? 'scale-105' : 'scale-100'}
                        `}
                    >
                        <Star
                            className={`
                                ${sizes[size]}
                                transition-all duration-200
                                ${isFilled
                                    ? 'fill-orange-500 text-orange-500'
                                    : 'fill-none text-gray-300'
                                }
                            `}
                            strokeWidth={2}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default StarRating;
