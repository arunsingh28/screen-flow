/**
 * Formats API error messages into user-friendly text for HR and recruitment professionals
 */
export const formatAuthError = (error: unknown): string => {
    if (!error) {
        return 'An unexpected error occurred. Please try again.';
    }

    // Handle Axios errors
    if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as any;

        // Check for specific error messages from the API
        const errorMessage = axiosError.response?.data?.detail ||
            axiosError.response?.data?.message ||
            axiosError.message;

        const statusCode = axiosError.response?.status;

        // Map common HTTP status codes to user-friendly messages
        switch (statusCode) {
            case 400:
                return errorMessage || 'Invalid credentials. Please check your email and password.';
            case 401:
                return 'Invalid email or password. Please try again.';
            case 403:
                return 'Access denied. Please contact your administrator.';
            case 404:
                return 'Account not found. Please check your credentials or sign up.';
            case 409:
                return errorMessage || 'An account with this email already exists.';
            case 422:
                return errorMessage || 'Please check your input and try again.';
            case 429:
                return 'Too many login attempts. Please wait a few minutes and try again.';
            case 500:
            case 502:
            case 503:
                return 'Our servers are experiencing issues. Please try again in a few moments.';
            default:
                return errorMessage || 'Unable to complete your request. Please try again.';
        }
    }

    // Handle Error objects
    if (error instanceof Error) {
        // Network errors
        if (error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
            return 'Unable to connect to the server. Please check your internet connection.';
        }

        return error.message || 'An unexpected error occurred. Please try again.';
    }

    // Handle string errors
    if (typeof error === 'string') {
        return error;
    }

    return 'An unexpected error occurred. Please try again.';
};

/**
 * Gets a user-friendly title for the error alert
 */
export const getErrorTitle = (error: unknown): string => {
    if (!error) return 'Error';

    if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as any;
        const statusCode = axiosError.response?.status;

        switch (statusCode) {
            case 401:
                return 'Authentication Failed';
            case 403:
                return 'Access Denied';
            case 404:
                return 'Account Not Found';
            case 409:
                return 'Account Already Exists';
            case 429:
                return 'Too Many Attempts';
            case 500:
            case 502:
            case 503:
                return 'Server Error';
            default:
                return 'Unable to Sign In';
        }
    }

    return 'Error';
};
