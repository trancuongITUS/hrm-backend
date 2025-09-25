/**
 * Standard API response structure for consistent responses across the application
 */
export interface ApiResponse<T = any> {
    /**
     * Indicates if the request was successful
     */
    success: boolean;

    /**
     * HTTP status code
     */
    statusCode: number;

    /**
     * Human-readable message describing the result
     */
    message: string;

    /**
     * Response data (present on successful requests)
     */
    data?: T;

    /**
     * Error details (present on failed requests)
     */
    error?: {
        /**
         * Error code for programmatic handling
         */
        code: string;

        /**
         * Detailed error message
         */
        details?: string;

        /**
         * Validation errors (for 400 Bad Request responses)
         */
        validationErrors?: ValidationError[];

        /**
         * Request ID for tracking
         */
        requestId?: string;
    };

    /**
     * Pagination metadata (for paginated responses)
     */
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };

    /**
     * Timestamp of the response
     */
    timestamp: string;

    /**
     * Request path that generated this response
     */
    path: string;
}

/**
 * Validation error structure
 */
export interface ValidationError {
    /**
     * Field that failed validation
     */
    field: string;

    /**
     * Value that failed validation
     */
    value: any;

    /**
     * Validation constraints that failed
     */
    constraints: Record<string, string>;
}

/**
 * Error response structure
 */
export interface ErrorResponse extends Omit<ApiResponse, 'data'> {
    success: false;
    error: NonNullable<ApiResponse['error']>;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = any> extends ApiResponse<T> {
    success: true;
    data: T;
}
