
import { toast } from "sonner";

// Show a consistent error toast
export function showErrorToast(error: any): void {
  const message = error.message || error.error_description || String(error);
  toast.error(`Error: ${message}`);
  console.error("Error details:", error);
}

// Define RetryOptions interface
export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
}

// Retry a function with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>, 
  options: RetryOptions | number = 3
): Promise<T> {
  // Handle backward compatibility with number parameter
  const maxRetries = typeof options === 'number' ? options : (options.maxRetries || 3);
  const initialDelay = typeof options === 'number' ? 1000 : (options.delayMs || 1000);
  
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        throw error;
      }
      console.log(`Attempt ${retries} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

// Parse and extract error message from different error formats
export function parseErrorMessage(error: any): string {
  if (!error) return "Unknown error";
  
  // Handle Supabase errors
  if (error.message) return error.message;
  
  // Handle API response errors
  if (error.error_description) return error.error_description;
  
  // Handle edge function errors
  if (typeof error === 'object' && error.error) return error.error;
  
  // Fallback
  return String(error);
}

export default {
  showErrorToast,
  withRetry,
  parseErrorMessage
};
