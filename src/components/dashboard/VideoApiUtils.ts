
import { toast } from "sonner";
import { ApiKeyStatus } from "@/services/apiKeyValidator";

/**
 * Helper utilities for video API functionality
 */
export const VideoApiUtils = {
  /**
   * Display appropriate UI feedback based on API validation results
   */
  handleApiValidationResults(
    apiStatus: Record<string, ApiKeyStatus>,
    onRetry: () => void
  ): JSX.Element | null {
    const invalidKeys = Object.values(apiStatus).filter(status => !status.isValid);
    
    // All APIs valid - show success message
    if (Object.values(apiStatus).length > 0 && invalidKeys.length === 0) {
      return (
        <div className="p-4 mb-6 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium mb-1">
            <CheckCircleIcon className="h-5 w-5" />
            All API Services Connected
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            All required API services are connected and working properly.
          </p>
        </div>
      );
    }
    
    // Some APIs invalid - show warning message
    if (invalidKeys.length > 0) {
      return (
        <div className="p-4 mb-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium mb-1">
            <AlertCircleIcon className="h-5 w-5" />
            API Connection Issues Detected
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            Some API services are not responding correctly. This may affect video generation.
          </p>
          <ul className="space-y-2 mb-4">
            {invalidKeys.map((key) => (
              <li key={key.name} className="flex items-start gap-2">
                <AlertCircleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{key.name.toUpperCase()} API</p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {key.errorMessage || "Connection failed"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <button 
            className="text-sm px-3 py-1 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            onClick={onRetry}
          >
            Retry Connection Check
          </button>
        </div>
      );
    }
    
    return null;
  },
  
  /**
   * Format error messages for toast notifications
   */
  formatErrorMessage(error: any): string {
    if (!error) return "Unknown error occurred";
    
    if (typeof error === 'string') return error;
    
    if (error.message) return error.message;
    
    if (error.error) return error.error;
    
    return "An unexpected error occurred";
  },
  
  /**
   * Show toast notification for API errors
   */
  showApiError(error: any, context: string): void {
    const message = this.formatErrorMessage(error);
    toast.error(`${context}: ${message}`);
    console.error(`${context} error:`, error);
  }
};

// Helper components for consistent UI
export const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
