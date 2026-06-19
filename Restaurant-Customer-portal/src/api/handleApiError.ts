export const handleApiError = (error: any) => {
    let message = "An error occurred.";
    if (error.response) {
        console.error("API Error:", error.response.data);
        message = error.response.data?.message || message;
    } else if (error.request) {
        console.error("No response from server.");
        message = "No response from server. Please check your network.";
    } else if (error.message) {
        message = error.message.message;
    } else if (error instanceof Error) {
        message = error.message;
    } else {
        const errorMessage = error.message?.message;
        console.error("Error:", errorMessage);
        if (errorMessage instanceof Array) {
            message = errorMessage[0];
        } else {
            message = errorMessage;
        }
    }

    // Custom error message for specific backend error
    if (typeof message === 'string' && message.includes("Failed to create order: Monthly order limit of 50 reached")) {
        return "Contact restaurant team - Unable to create due to some restrictions";
    }
    return message;
};