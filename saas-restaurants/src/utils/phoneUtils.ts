export const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return '';

    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    if (cleaned.startsWith('+64')) {
        return cleaned;
    }

    if (cleaned.startsWith('64')) {
        return '+' + cleaned;
    }

    if (cleaned.startsWith('0')) {
        return '+64' + cleaned.substring(1);
    }

    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    return '+64' + cleaned;
};

export const displayPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return '';

    const formatted = formatPhoneNumber(phoneNumber);

    if (formatted.startsWith('+64')) {
        return formatted;
    }

    return formatted;
};

export const validateNZPhoneNumber = (phoneNumber: string): boolean => {
    if (!phoneNumber) return false;

    if (phoneNumber.trim().startsWith("-")) return false;

    const formatted = formatPhoneNumber(phoneNumber);

    const regex = /^\+64\d{8,10}$/;

    return regex.test(formatted);
};

export const removeCountryCode = (phoneNumber: string): string => {
    if (!phoneNumber) return '';

    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    if (cleaned.startsWith('+64')) {
        return cleaned.substring(3);
    }

    if (cleaned.startsWith('64')) {
        return cleaned.substring(2);
    }

    if (cleaned.startsWith('0')) {
        return cleaned.substring(1);
    }

    if (cleaned.startsWith('+94')) {
        return cleaned.substring(3);
    }

    if (cleaned.startsWith('94')) {
        return cleaned.substring(2);
    }

    return cleaned.replace(/^\+/, '');
};