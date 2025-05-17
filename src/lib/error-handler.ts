
import { toast } from "sonner";

// Error handler utility
export const showErrorToast = (error: unknown) => {
  if (typeof error === "string") {
    toast.error(error);
    return;
  }
  
  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }
  
  toast.error("An unknown error occurred");
};

export const parseErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unknown error occurred";
};

interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  onRetry?: (attempt: number, error: any) => void;
  retryOnlyIf?: (error: any) => boolean;
}

// Utility to retry API calls with exponential backoff
export const withRetry = async <T>(
  fn: () => Promise<T>, 
  options: RetryOptions | number = 3
): Promise<T> => {
  let maxRetries: number;
  let delayMs: number;
  let onRetry: ((attempt: number, error: any) => void) | undefined;
  let retryOnlyIf: ((error: any) => boolean) | undefined;
  
  // Handle legacy number parameter for backward compatibility
  if (typeof options === 'number') {
    maxRetries = options;
    delayMs = 1000;
    onRetry = undefined;
    retryOnlyIf = undefined;
  } else {
    maxRetries = options.maxRetries;
    delayMs = options.delayMs;
    onRetry = options.onRetry;
    retryOnlyIf = options.retryOnlyIf;
  }
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // First attempt or subsequent retries
      if (attempt > 0) {
        // Exponential backoff with jitter
        const delay = Math.min(delayMs * Math.pow(2, attempt - 1), 10000) * (0.75 + Math.random() * 0.5);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (onRetry) {
          onRetry(attempt, lastError);
        }
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
      
      // If retry condition is provided and it returns false, don't retry
      if (retryOnlyIf && !retryOnlyIf(error)) {
        console.log("Not retrying due to retry condition");
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError;
};
