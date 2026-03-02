/**
 * ACCESSIBILITY UTILITIES
 * Common accessibility patterns and helpers
 */

import React from 'react';

/**
 * Generate unique IDs for ARIA relationships
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export function generateAriaId(prefix = 'aria') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook for managing focus trap in modals/dialogs
 * @param {boolean} isOpen - Whether the modal is open
 * @param {React.RefObject} containerRef - Ref to the container element
 */
export function useFocusTrap(isOpen, containerRef) {
  React.useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when modal opens
    firstElement?.focus();

    function handleTabKey(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [isOpen, containerRef]);
}

/**
 * Hook for managing Escape key to close modals
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback to close the modal
 */
export function useEscapeKey(isOpen, onClose) {
  React.useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
}

/**
 * Get accessible button props
 * @param {Object} options
 * @param {string} options.label - Accessible label
 * @param {boolean} options.disabled - Whether button is disabled
 * @param {boolean} options.pressed - For toggle buttons
 * @returns {Object} Props to spread on button
 */
export function getAccessibleButtonProps({ label, disabled = false, pressed = undefined }) {
  const props = {
    'aria-label': label,
    'aria-disabled': disabled ? 'true' : undefined,
  };

  if (pressed !== undefined) {
    props['aria-pressed'] = pressed ? 'true' : 'false';
  }

  return props;
}

/**
 * Get accessible form field props
 * @param {Object} options
 * @param {string} options.id - Field ID
 * @param {string} options.label - Field label
 * @param {string} options.error - Error message
 * @param {boolean} options.required - Whether field is required
 * @param {string} options.description - Help text
 * @returns {Object} Props for label, input, and containers
 */
export function getAccessibleFormFieldProps({ 
  id, 
  label, 
  error, 
  required = false, 
  description 
}) {
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  const describedBy = [
    description && descriptionId,
    error && errorId,
  ].filter(Boolean).join(' ');

  return {
    label: {
      id: labelId,
      htmlFor: id,
    },
    input: {
      id,
      'aria-labelledby': labelId,
      'aria-describedby': describedBy || undefined,
      'aria-invalid': error ? 'true' : undefined,
      'aria-required': required ? 'true' : undefined,
    },
    error: {
      id: errorId,
      role: 'alert',
      'aria-live': 'polite',
    },
    description: {
      id: descriptionId,
    },
  };
}

/**
 * Screen reader only text (visually hidden but accessible)
 * @param {string} text - Text for screen readers
 * @returns {JSX.Element}
 */
export function ScreenReaderOnly({ children }) {
  return (
    <span
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Skip to main content link
 * @returns {JSX.Element}
 */
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="skip-to-main"
      style={{
        position: 'absolute',
        top: '-40px',
        left: 0,
        background: '#000',
        color: '#fff',
        padding: '8px',
        textDecoration: 'none',
        zIndex: 10000,
      }}
      onFocus={(e) => {
        e.target.style.top = '0';
      }}
      onBlur={(e) => {
        e.target.style.top = '-40px';
      }}
    >
      Skip to main content
    </a>
  );
}

/**
 * Accessible loading indicator
 * @param {string} message - Loading message
 * @returns {JSX.Element}
 */
export function LoadingIndicator({ message = 'Loading...' }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <ScreenReaderOnly>{message}</ScreenReaderOnly>
      <div className="loading-spinner" aria-hidden="true">
        {/* Visual spinner */}
      </div>
    </div>
  );
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    announcement.textContent = message;
  }, 100);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if keyboard navigation is being used
 * Useful for showing focus indicators only for keyboard users
 */
export function useKeyboardNavigation() {
  const [isKeyboardNavigation, setIsKeyboardNavigation] = React.useState(false);

  React.useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Tab') {
        setIsKeyboardNavigation(true);
      }
    }

    function handleMouseDown() {
      setIsKeyboardNavigation(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardNavigation;
}

export default {
  generateAriaId,
  useFocusTrap,
  useEscapeKey,
  getAccessibleButtonProps,
  getAccessibleFormFieldProps,
  ScreenReaderOnly,
  SkipToMain,
  LoadingIndicator,
  announceToScreenReader,
  useKeyboardNavigation,
};
