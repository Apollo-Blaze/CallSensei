export interface ResponseModel {
    id: string;
    requestId: string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    timestamp: Date;
    duration: number; // Response time in milliseconds
    size: number; // Response size in bytes
    contentType?: string;
    isSuccess: boolean;
    error?: string;
}

export interface ResponseData {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
}

export interface CreateResponseData extends Omit<ResponseModel, 'id' | 'timestamp'> {
    id?: string;
    timestamp?: Date;
}

export interface UpdateResponseData extends Partial<Omit<ResponseModel, 'id' | 'timestamp'>> {
    id: string;
}

// Response status categories
export const ResponseStatus = {
    SUCCESS: 'success',
    CLIENT_ERROR: 'client_error',
    SERVER_ERROR: 'server_error',
    NETWORK_ERROR: 'network_error',
    TIMEOUT: 'timeout',
} as const;

export type ResponseStatus = typeof ResponseStatus[keyof typeof ResponseStatus];

export const getResponseStatusCategory = (status: number): ResponseStatus => {
    if (status >= 200 && status < 300) return ResponseStatus.SUCCESS;
    if (status >= 400 && status < 500) return ResponseStatus.CLIENT_ERROR;
    if (status >= 500 && status < 600) return ResponseStatus.SERVER_ERROR;
    return ResponseStatus.NETWORK_ERROR;
};

export const isSuccessfulResponse = (status: number): boolean => {
    return status >= 200 && status < 300;
};

// Validation schemas
export const validateResponseModel = (response: Partial<ResponseModel>): string[] => {
    const errors: string[] = [];

    if (!response.requestId || response.requestId.trim() === '') {
        errors.push('Request ID is required');
    }

    if (response.status === undefined || response.status < 0) {
        errors.push('Invalid status code');
    }

    if (!response.statusText || response.statusText.trim() === '') {
        errors.push('Status text is required');
    }

    if (response.duration === undefined || response.duration < 0) {
        errors.push('Invalid duration');
    }

    return errors;
};

// Factory function to create a new response
export const createResponse = (data: CreateResponseData): ResponseModel => {
    const isSuccess = isSuccessfulResponse(data.status);

    return {
        id: data.id || Math.random().toString(36).substr(2, 9),
        requestId: data.requestId,
        status: data.status,
        statusText: data.statusText,
        headers: data.headers || {},
        body: data.body || '',
        timestamp: data.timestamp || new Date(),
        duration: data.duration,
        size: data.size || 0,
        contentType: data.contentType,
        isSuccess,
        error: data.error,
    };
};

// Helper function to calculate response size
export const calculateResponseSize = (body: string): number => {
    return new Blob([body]).size;
};

// Helper function to extract content type from headers
export const extractContentType = (headers: Record<string, string>): string | undefined => {
    return headers['content-type'] || headers['Content-Type'];
}; 