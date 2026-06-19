export const formatPrice = (price: number): string => `NZD ${price.toFixed(2)}`;

export const formatDate = (date: string): string => {
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
