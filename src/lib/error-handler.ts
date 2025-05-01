
import { toast } from "sonner";

// Standard error types
export type APIErrorType = 
  | 'auth' 
  | 'network' 
  | 'database' 
  | 'validation' 
  | 'not_found'
  | 'server'
  | 'unknown';

// Interface for structured API errors
export interface APIError {
  type: APIErrorType;
  message: string;
  details?: string;
  code?: string;
  retryable?: boolean;
}

// Base function to handle and standardize errors
export function handleAPIError(error: unknown): APIError {
  console.error("API Error:", error);
  
  // Default error
  let standardError: APIError = {
    type: 'unknown',
    message: 'An unexpected error occurred',
    retryable: false
  };
  
  // Handle Supabase specific errors
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    
    // Handle Supabase error object
    if (err.error) {
      if (err.error.indexOf('Authentication') >= 0 || err.status === 401) {
        standardError = {
          type: 'auth',
          message: 'Authentication failed',
          details: err.error,
          retryable: false
        };
      } else if (err.status === 404) {
        standardError = {
          type: 'not_found',
          message: 'Resource not found',
          details: err.error,
          retryable: false
        };
      } else if (err.status >= 500) {
        standardError = {
          type: 'server',
          message: 'Server error',
          details: err.error,
          retryable: true
        };
      }
    } 
    // Handle network errors
    else if (err.message && err.message.includes('Failed to fetch')) {
      standardError = {
        type: 'network',
        message: 'Network connection error',
        details: 'Please check your internet connection and try again',
        retryable: true
      };
    }
    // If error has a message, use it
    else if (err.message) {
      standardError.message = err.message;
      standardError.details = err.details || err.stack;
    }
  } 
  // Handle string errors
  else if (typeof error === 'string') {
    standardError.message = error;
  }

  return standardError;
}

// Function to show appropriate error message to user
export function showErrorToast(error: unknown): void {
  const standardError = handleAPIError(error);
  
  switch (standardError.type) {
    case 'auth':
      toast.error('Authentication Error', {
        description: standardError.message,
        duration: 5000
      });
      break;
    case 'network':
      toast.error('Connection Error', {
        description: standardError.message,
        action: standardError.retryable ? {
          label: 'Retry',
          onClick: () => window.location.reload()
        } : undefined,
        duration: 5000
      });
      break;
    case 'not_found':
      toast.error('Not Found', {
        description: standardError.message,
        duration: 5000
      });
      break;
    case 'server':
      toast.error('Server Error', {
        description: 'Our team has been notified. Please try again later.',
        duration: 5000
      });
      break;
    default:
      toast.error('Error', {
        description: standardError.message,
        duration: 5000
      });
  }
}

// Retry mechanism for API calls
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 1000
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      retries++;
      
      // Check if we've exhausted retries
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Analyze error to see if it's retryable
      const standardError = handleAPIError(error);
      if (!standardError.retryable) {
        throw error;
      }
      
      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, retries - 1);
      console.log(`Retrying operation (${retries}/${maxRetries}) after ${backoffDelay}ms`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}
