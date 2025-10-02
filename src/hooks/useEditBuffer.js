/**
 * useEditBuffer Hook
 *
 * CRITICAL FIX: Solves the "typing digits get eaten" bug
 *
 * Problem: Current code parses/rounds on every keystroke, causing:
 * - Cursor jumps
 * - Last digit changes unexpectedly
 * - Typing "7" becomes "1"
 *
 * Solution: Keep a string buffer while editing, only parse on blur/Enter
 *
 * Usage:
 * const { editing, buffer, setBuffer, start, commit, cancel } = useEditBuffer(
 *   initialValue,
 *   onCommit,
 *   parseFn
 * );
 */

import { useState, useRef } from 'react';

export function useEditBuffer(initialValue, onCommit, parseFn = parseFloat) {
  const [editing, setEditing] = useState(false);
  const [buffer, setBuffer] = useState('');
  const originalValueRef = useRef(null);

  /**
   * Start editing mode
   * @param {string|number} value - The current value to edit
   */
  const start = (value) => {
    originalValueRef.current = value;
    setBuffer(String(value));
    setEditing(true);
  };

  /**
   * Commit the edited value
   * Parses the buffer and calls onCommit if valid AND changed
   */
  const commit = () => {
    const parsed = parseFn(buffer);
    // Only commit if value is valid AND has actually changed
    if (!isNaN(parsed) && parsed !== originalValueRef.current) {
      onCommit(parsed);
    }
    setEditing(false);
  };

  /**
   * Cancel editing and revert to original value
   */
  const cancel = () => {
    setEditing(false);
  };

  /**
   * Handle keyboard events (Enter to commit, Escape to cancel)
   * @param {KeyboardEvent} e
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  return {
    editing,
    buffer,
    setBuffer,
    start,
    commit,
    cancel,
    handleKeyDown
  };
}

/**
 * Specialized parse functions for common use cases
 */

// Parse to cents (rounds to 2 decimal places)
export const parseToCents = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
};

// Parse to integer (for impressions/views)
export const parseToInteger = (value) => {
  const num = parseInt(value, 10);
  if (isNaN(num)) return 0;
  return num;
};

// Parse to positive number
export const parseToPositive = (value) => {
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return 0;
  return num;
};
