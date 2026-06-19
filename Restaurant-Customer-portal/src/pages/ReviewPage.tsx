import React, { useLayoutEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { submitReviewRequest, resetReviewState } from '../features/Review/reviewSlice';
import { ReviewRequest } from '../features/Review/types';
import Header from '../components/Header';
import StarRating from '../components/StarRating';
import { Button } from '../components/Button';
import { CheckCircle2, MessageSquare, Star, ThumbsUp, UtensilsCrossed, Users, Wallet } from 'lucide-react';
import useRestaurant from '../hooks/useRestaurant';
import { RootLinks } from '../routers/types';

const ReviewPage: React.FC = () => {
    const { orderId, customerId } = useParams<{ orderId: string, customerId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { restaurantId } = useRestaurant();

    const { review, isSubmitting } = useSelector((state: RootState) => state.review);

    const [overallRating, setOverallRating] = useState(0);
    const [foodQuality, setFoodQuality] = useState(0);
    const [service, setService] = useState(0);
    const [ambiance, setAmbiance] = useState(0);
    const [valueForMoney, setValueForMoney] = useState(0);
    const [comment, setComment] = useState('');

    useLayoutEffect(() => {
        if (review?.id) {
            // Success state will be shown in the component
            setTimeout(() => {
                dispatch(resetReviewState());
                navigate(`${RootLinks.ORDERSUMMARY}/${orderId}`, { replace: true })
            }, 3000);
        }
    }, [review, navigate, dispatch]);

    const handleSubmit = () => {
        if (overallRating === 0) {
            return;
        }

        const reviewData: ReviewRequest = {
            restaurantId,
            customerId,
            orderId: orderId || '',
            rating: overallRating,
            comment: comment.trim(),
            metadata: {
                foodQuality,
                service,
                ambiance,
                valueForMoney
            }
        };

        dispatch(submitReviewRequest(reviewData));
    };

    const isFormValid = overallRating > 0;

    // Success state
    if (review?.id) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Header title="Review Submitted" showBackButton={false} />

                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center space-y-6 animate-fade-in">
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-30 animate-pulse" />
                                <div className="relative bg-linear-to-br from-green-100 to-emerald-100 rounded-full w-fit p-6 border-4 border-green-200 shadow-xl">
                                    <CheckCircle2 className="h-16 w-16 text-green-600" strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 px-8">
                            <h2 className="text-3xl font-extrabold text-gray-900">
                                Thank You!
                            </h2>
                            <p className="text-gray-600 text-lg">
                                Your feedback helps us serve you better
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <StarRating
                                rating={overallRating}
                                onRatingChange={() => { }}
                                size="lg"
                                readonly
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header title="Rate Your Experience" />

            <div className="flex-1 p-4 sm:p-6 md:p-8 mt-16 mb-24 max-w-3xl mx-auto w-full">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-orange-100 to-red-100 rounded-full mb-4">
                        <Star className="w-8 h-8 text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        How was your experience?
                    </h2>
                    <p className="text-gray-600">
                        Your feedback helps us improve our service
                    </p>
                </div>

                {/* Overall Rating */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                        Overall Rating
                    </h3>
                    <div className="flex justify-center mb-2">
                        <StarRating
                            rating={overallRating}
                            onRatingChange={setOverallRating}
                            size="lg"
                        />
                    </div>
                    <p className="text-center text-sm text-gray-500">
                        {overallRating === 0 && 'Tap to rate'}
                        {overallRating === 1 && 'Poor'}
                        {overallRating === 2 && 'Fair'}
                        {overallRating === 3 && 'Good'}
                        {overallRating === 4 && 'Very Good'}
                        {overallRating === 5 && 'Excellent'}
                    </p>
                </div>

                {/* Category Ratings */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">
                        Rate by Category
                    </h3>

                    <div className="space-y-6">
                        {/* Food Quality */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="font-semibold text-gray-900">Food Quality</span>
                            </div>
                            <StarRating
                                rating={foodQuality}
                                onRatingChange={setFoodQuality}
                                size="sm"
                            />
                        </div>

                        {/* Service */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="font-semibold text-gray-900">Service</span>
                            </div>
                            <StarRating
                                rating={service}
                                onRatingChange={setService}
                                size="sm"
                            />
                        </div>

                        {/* Ambiance */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <ThumbsUp className="w-5 h-5 text-purple-600" />
                                </div>
                                <span className="font-semibold text-gray-900">Ambiance</span>
                            </div>
                            <StarRating
                                rating={ambiance}
                                onRatingChange={setAmbiance}
                                size="sm"
                            />
                        </div>

                        {/* Value for Money */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="font-semibold text-gray-900">Value for Money</span>
                            </div>
                            <StarRating
                                rating={valueForMoney}
                                onRatingChange={setValueForMoney}
                                size="sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Comment Section */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                            Share Your Thoughts
                        </h3>
                        <span className="text-sm text-gray-500">(Optional)</span>
                    </div>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell us more about your experience..."
                        rows={5}
                        maxLength={500}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-2 text-right">
                        {comment.length}/500 characters
                    </p>
                </div>
            </div>

            {/* Fixed Footer with Submit Button */}
            <footer className="fixed bottom-0 left-0 right-0 w-full p-4 sm:p-6 bg-white/95 backdrop-blur-md border-t border-orange-100 shadow-2xl z-50">
                <div className="max-w-3xl mx-auto">
                    <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                        isLoading={isSubmitting}
                        size="lg"
                        className="relative w-full group/btn overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl"
                    >
                        <span className="text-white font-medium tracking-wide sm:text-lg">
                            Submit Review
                        </span>
                    </Button>

                    {!isFormValid && (
                        <p className="text-center text-sm text-orange-600 mt-3">
                            Please provide an overall rating to submit
                        </p>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default ReviewPage;
