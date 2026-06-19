import { FC } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export const StarRating: FC<StarRatingProps> = ({
    rating,
    maxRating = 5,
    size = 'md',
    showLabel = true
}) => {
    const sizeClasses = {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const getRatingColor = (rating: number): string => {
        if (rating >= 4.5) return 'text-green-500';
        if (rating >= 3.5) return 'text-yellow-500';
        if (rating >= 2.5) return 'text-orange-500';
        return 'text-red-500';
    };

    const getRatingLabel = (rating: number): string => {
        if (rating >= 4.5) return 'Excellent';
        if (rating >= 3.5) return 'Good';
        if (rating >= 2.5) return 'Average';
        if (rating >= 1.5) return 'Poor';
        return 'Very Poor';
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
                {Array.from({ length: maxRating }).map((_, index) => {
                    const starValue = index + 1;
                    const isFilled = starValue <= rating;
                    const isPartial = starValue > rating && starValue - 1 < rating;
                    const partialPercentage = isPartial ? ((rating - (starValue - 1)) * 100) : 0;

                    return (
                        <div key={index} className="relative">
                            {/* Background (empty) star */}
                            <Star
                                className={`${sizeClasses[size]} text-gray-300`}
                                fill="currentColor"
                            />

                            {/* Filled star overlay */}
                            {(isFilled || isPartial) && (
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{
                                        width: isFilled ? '100%' : `${partialPercentage}%`
                                    }}
                                >
                                    <Star
                                        className={`${sizeClasses[size]} ${getRatingColor(rating)}`}
                                        fill="currentColor"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {showLabel && (
                <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold ${getRatingColor(rating)}`}>
                        {rating.toFixed(1)}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                        {getRatingLabel(rating)}
                    </span>
                </div>
            )}
        </div>
    );
};
