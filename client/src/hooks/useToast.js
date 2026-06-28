import { useCallback } from 'react';

let _addToast = null;
export function _registerToast(fn) { _addToast = fn; }

// Can be called anywhere — inside or outside React components
export function toast(message, type = 'info', duration = 4000) {
  if (_addToast) _addToast(message, type, duration);
}

export function useToast() {
  return {
    success: useCallback((msg, dur) => toast(msg, 'success', dur), []),
    error:   useCallback((msg, dur) => toast(msg, 'error',   dur), []),
    info:    useCallback((msg, dur) => toast(msg, 'info',    dur), []),
    warning: useCallback((msg, dur) => toast(msg, 'warning', dur), []),
  };
}
