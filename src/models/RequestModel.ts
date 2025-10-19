export interface RequestModel {
    id: string;
    name?: string;
    method: RequestMethod;
    url: string;
    headers: Record<string, string>;
    body: string;
    timestamp: string;
    description?: string;
    tags?: string[];
    isActive?: boolean;
}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface RequestFormData {
    method: RequestMethod;
    url: string;
    headers: Record<string, string>;
    body: string;
}

export interface CreateRequestData extends Omit<RequestModel, 'id' | 'timestamp'> {
    id?: string;
    timestamp?: string;
}

export interface UpdateRequestData extends Partial<Omit<RequestModel, 'id' | 'timestamp'>> {
    id: string;
}

// Validation schemas
export const REQUEST_METHODS: RequestMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

export const validateRequestModel = (request: Partial<RequestModel>): string[] => {
    const errors: string[] = [];

    if (!request.method || !REQUEST_METHODS.includes(request.method as RequestMethod)) {
        errors.push('Invalid HTTP method');
    }

    if (!request.url || request.url.trim() === '') {
        errors.push('URL is required');
    }

    if (request.url && !isValidUrl(request.url)) {
        errors.push('Invalid URL format');
    }

    return errors;
};

export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Factory function to create a new request
export const createRequest = (data: CreateRequestData): RequestModel => {
    return {
        id: data.id || Math.random().toString(36).substr(2, 9),
        name: data.name || 'New Request',
        method: data.method,
        url: data.url,
        headers: data.headers || {},
        body: data.body || '',
        timestamp: data.timestamp || new Date().toISOString(),
        description: data.description,
        tags: data.tags || [],
        isActive: data.isActive !== false,
    };
}; 