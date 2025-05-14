
import { toast as sonnerToast } from "sonner";

// Re-export sonner toast to maintain compatibility
export const toast = sonnerToast;

// Provide a backward-compatible useToast hook
export const useToast = () => {
  return {
    toast: sonnerToast
  };
};
