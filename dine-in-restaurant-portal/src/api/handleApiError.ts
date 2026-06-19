export const handleApiError = (error: any) => {
    if (error.response) {
        console.error("API Error:", error.response.data);
        return error.response.data?.message || "An error occurred.";
    } else if (error.request) {
        console.error("No response from server.");
        return "No response from server. Please check your network.";
    } else if (error.message) {
        return error.message.message;
    } if (error instanceof Error) {
        return error.message
    } else {
        const errorMessage = error.message.message;
        console.error("Error:", error.message.message);
        if (errorMessage instanceof Array) {
            return error.message.message[0];
        } else {
            return errorMessage;
        }
    }

};