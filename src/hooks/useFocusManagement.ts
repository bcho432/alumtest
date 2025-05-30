import { useEffect, useRef } from 'react';

interface FocusOptions {
  trapFocus?: boolean;
  returnFocus?: boolean;
  initialFocus?: HTMLElement | null;
}

export function useFocusManagement(options: FocusOptions = {}) {
  const {
    trapFocus = false,
    returnFocus = true,
    initialFocus = null
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Store the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the initial element or the container
    if (initialFocus) {
      initialFocus.focus();
    } else {
      containerRef.current.focus();
    }

    if (trapFocus) {
      const handleFocusTrap = (event: KeyboardEvent) => {
        if (event.key !== 'Tab' || !containerRef.current) return;

        const focusableElements = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener('keydown', handleFocusTrap);
      return () => {
        document.removeEventListener('keydown', handleFocusTrap);
        if (returnFocus && previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }

    return () => {
      if (returnFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [trapFocus, returnFocus, initialFocus]);

  return containerRef;
}

// Example usage:
// const modalRef = useFocusManagement({ trapFocus: true, returnFocus: true });
// return <div ref={modalRef} tabIndex={-1}>...</div>; 