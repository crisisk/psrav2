'use client';

import React, { createContext, useContext } from 'react';
import { toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Provider - wraps sonner toast functionality
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showToast = (message: string, type: ToastType) => {
    switch (type) {
      case 'success':
        sonnerToast.success(message);
        break;
      case 'error':
        sonnerToast.error(message);
        break;
      case 'warning':
        sonnerToast.warning(message);
        break;
      case 'info':
        sonnerToast.info(message);
        break;
      default:
        sonnerToast(message);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast notifications
 * Uses sonner under the hood
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback to sonner directly if not in provider
    return {
      showToast: (message: string, type: ToastType) => {
        switch (type) {
          case 'success':
            sonnerToast.success(message);
            break;
          case 'error':
            sonnerToast.error(message);
            break;
          case 'warning':
            sonnerToast.warning(message);
            break;
          case 'info':
            sonnerToast.info(message);
            break;
          default:
            sonnerToast(message);
        }
      }
    };
  }
  return context;
};

export default useToast;
