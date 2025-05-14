
import { toast as sonnerToast } from "sonner";
import * as React from "react";

const TOAST_LIMIT = 5;
export const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = ReturnType<typeof sonnerToast>;

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

const genId = () => {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
};

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: {
        id: string;
        title?: string;
        description?: string;
        action?: React.ReactNode;
        success?: boolean;
        duration?: number;
      };
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: {
        id: string;
        title?: string;
        description?: string;
        action?: React.ReactNode;
        success?: boolean;
        duration?: number;
      };
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId: string;
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId: string;
    };

export const toast = (props: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  success?: boolean;
  duration?: number;
}) => {
  const id = genId();

  const dismiss = () => sonnerToast.dismiss(id);

  sonnerToast[props.success ? "success" : "error"](props.title, {
    id,
    description: props.description,
    action: props.action,
    duration: props.duration || 5000,
  });

  return {
    id,
    dismiss,
  };
};

// Simplified version using Sonner's built-in methods
toast.error = (title: string, description?: string) => {
  return sonnerToast.error(title, {
    description,
    duration: 5000,
  });
};

toast.success = (title: string, description?: string) => {
  return sonnerToast.success(title, {
    description,
    duration: 5000,
  });
};

toast.warning = (title: string, description?: string) => {
  return sonnerToast.warning(title, {
    description,
    duration: 5000,
  });
};

toast.info = (title: string, description?: string) => {
  return sonnerToast.info(title, {
    description,
    duration: 5000,
  });
};

export function useToast() {
  return {
    toast,
  };
}
