import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Validate environment at module load
const validateApiEnvironment = () => {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (!apiBase) {
    console.warn(
      'NEXT_PUBLIC_API_BASE not set, defaulting to http://localhost:8000/api/v1'
    );
  }
};

validateApiEnvironment();

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T = any> {
  status: string;
  data?: T;
  error?: string;
  message?: string;
}

// Create axios instance with default config
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth tokens if available
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        // Try to get Firebase auth token if in browser
        if (typeof window !== 'undefined') {
          const { auth } = await import('@/lib/firebase');
          const user = auth.currentUser;
          if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        // Silently fail if token retrieval fails
        console.debug('Could not attach auth token:', error);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors consistently
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const status = error.response?.status || 500;
      const data = error.response?.data as any;

      let errorMessage = error.message;
      let errorCode = 'UNKNOWN_ERROR';
      let errorDetails = data;

      if (data) {
        errorMessage = data.detail || data.message || errorMessage;
        errorCode = data.code || `HTTP_${status}`;
      }

      if (status === 0) {
        errorCode = 'NETWORK_ERROR';
        errorMessage = 'Network request failed. Check your connection.';
      } else if (status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Authentication failed. Please login again.';
      } else if (status === 403) {
        errorCode = 'FORBIDDEN';
        errorMessage = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        errorCode = 'NOT_FOUND';
        errorMessage = 'The requested resource was not found.';
      } else if (status === 422) {
        errorCode = 'VALIDATION_ERROR';
        errorMessage = 'Invalid data provided.';
      } else if (status >= 500) {
        errorCode = 'SERVER_ERROR';
        errorMessage = 'Server error. Please try again later.';
      }

      const apiError = new ApiError(status, errorCode, errorMessage, errorDetails);
      return Promise.reject(apiError);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// Helper function to handle API calls with consistent error handling
export const handleApiCall = async <T = any>(
  apiCall: Promise<AxiosResponse<T>>,
  fallbackMessage = 'Operation failed'
): Promise<T> => {
  try {
    const response = await apiCall;
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'UNKNOWN_ERROR', fallbackMessage, error);
  }
};

export default apiClient;
