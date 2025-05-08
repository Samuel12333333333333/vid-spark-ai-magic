
import { toast } from "sonner";

// Show a consistent error toast
export function showErrorToast(error: any): void {
  const message = error.message || error.error_description || String(error);
  toast.error(`Error: ${message}`);
  console.error("Error details:", error);
}

// Retry a function with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>, 
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
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
