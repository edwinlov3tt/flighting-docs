/**
 * ExportLoadingOverlay Component
 *
 * Full-screen loading overlay shown during Excel export
 * Displays animated spinner and status message
 *
 * Props:
 * - isLoading: boolean - Whether export is in progress
 */

import React from 'react';

export function ExportLoadingOverlay({ isLoading }) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Animated Spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-green-600 rounded-full animate-spin"></div>
          </div>

          {/* Loading Text */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Exporting to Excel
            </h3>
            <p className="text-sm text-gray-600">
              Please wait while we generate your flight plan...
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
