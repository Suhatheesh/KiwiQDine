import { OrderItems } from '../features/orders/types';
import { OrderStatus } from './constants';

export function calculateRemainingTime(item: OrderItems): number | null {
    // Not started yet
    if (!item.startedAt || !item.estimatedPreparationTime) {
        return null;
    }

    // Already done
    if (item.status === OrderStatus.READY || item.status === OrderStatus.SERVED) {
        return 0;
    }

    const startTime = new Date(item.startedAt);
    const estimatedEndTime = new Date(
        startTime.getTime() + item.estimatedPreparationTime * 60 * 1000
    );
    const now = new Date();
    const remainingMs = estimatedEndTime.getTime() - now.getTime();

    // Time's up
    if (remainingMs <= 0) {
        return 0;
    }

    return Math.ceil(remainingMs / 60000); // Convert to minutes
}

export function calculateMaxRemainingTime(items: OrderItems[]): number | null {
    const remainingTimes = items
        .map(item => calculateRemainingTime(item))
        .filter((time) => time !== null);

    if (remainingTimes.length === 0) {
        return null;
    }

    return Math.max(...remainingTimes);
}

export function formatRemainingTime(minutes: number | null): string {
    if (minutes === null) {
        return 'Not started';
    }

    if (minutes === 0) {
        return 'Ready';
    }

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
}

export function getTimeStatusColor(minutes: number | null): string {
    if (minutes === null) {
        return 'text-gray-500';
    }

    if (minutes === 0) {
        return 'text-green-600';
    }

    if (minutes <= 5) {
        return 'text-red-600';
    }

    if (minutes <= 10) {
        return 'text-orange-600';
    }

    return 'text-blue-600';
}

export function isItemOverdue(item: OrderItems): boolean {
    const remaining = calculateRemainingTime(item);
    return remaining === 0 && item.status === OrderStatus.INPROGRESS;
}

export function getAllItemsFromOrder(itemsByCategory: { category: string; items: OrderItems[] }[]): OrderItems[] {
    return itemsByCategory.flatMap(cat => cat.items);
}
