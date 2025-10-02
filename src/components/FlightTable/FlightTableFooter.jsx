/**
 * FlightTableFooter Component
 *
 * Renders totals row at bottom of table
 * Shows different columns based on template type
 *
 * Props:
 * - totals: object - Calculated totals { budget, impressions?, trafficBudget?, etc. }
 * - templateType: 'sem-social' | 'programmatic' | 'youtube'
 */

import React from 'react';
import { TEMPLATE_TYPES } from '../../utils/constants';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export function FlightTableFooter({ totals, templateType }) {
  const renderTotals = () => {
    switch (templateType) {
      case TEMPLATE_TYPES.SEM_SOCIAL:
        return (
          <>
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
              Total
            </td>
            <td className="border border-gray-200 px-4 py-3" />
            <td className="border border-gray-200 px-4 py-3" />
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
              {formatCurrency(totals.budget)}
            </td>
            <td className="border border-gray-200 px-4 py-3" />
          </>
        );

      case TEMPLATE_TYPES.PROGRAMMATIC:
        return (
          <>
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
              Total
            </td>
            <td className="border border-gray-200 px-4 py-3" />
            <td className="border border-gray-200 px-4 py-3" />
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
              {formatCurrency(totals.budget)}
            </td>
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
              {formatNumber(totals.impressions || 0)}
            </td>
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
              {formatCurrency(totals.trafficBudget || 0)}
            </td>
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
              {formatNumber(totals.trafficImpressions || 0)}
            </td>
            <td className="border border-gray-200 px-4 py-3" />
          </>
        );

      case TEMPLATE_TYPES.YOUTUBE:
        return (
          <>
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
              Total
            </td>
            <td className="border border-gray-200 px-4 py-3" />
            <td className="border border-gray-200 px-4 py-3" />
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
              {formatNumber(totals.totalViews || 0)}
            </td>
            <td className="border border-gray-200 px-4 py-3" />
            <td className="border border-gray-200 px-4 py-3" />
            <td className="border border-gray-200 px-4 py-3" />
            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
              {formatCurrency(totals.totalRetail || 0)}
            </td>
            <td className="border border-gray-200 px-4 py-3" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <tfoot>
      <tr className="bg-blue-50 font-semibold">
        {renderTotals()}
      </tr>
    </tfoot>
  );
}
