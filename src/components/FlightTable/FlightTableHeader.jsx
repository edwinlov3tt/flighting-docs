/**
 * FlightTableHeader Component
 *
 * Renders table header based on template type
 * Three template types:
 * - sem-social: Line, Start Date, End Date, Budget, Actions
 * - programmatic: + Impressions, Traffic Budget, Traffic Impressions
 * - youtube: Line, Flight Start/End, Total Views, Days, Daily Views, Daily Budget, Total Retail, Actions
 *
 * Props:
 * - templateType: 'sem-social' | 'programmatic' | 'youtube'
 */

import React from 'react';
import { tableStyles, TEMPLATE_TYPES } from '../../utils/constants';

export function FlightTableHeader({ templateType }) {
  const renderHeaders = () => {
    switch (templateType) {
      case TEMPLATE_TYPES.SEM_SOCIAL:
        return (
          <>
            <th className={`${tableStyles.th} w-16`}>Line</th>
            <th className={`${tableStyles.th} w-28`}>Start Date</th>
            <th className={`${tableStyles.th} w-28`}>End Date</th>
            <th className={`${tableStyles.th} w-32`}>Budget</th>
            <th className={`${tableStyles.th} w-32`}>Actions</th>
          </>
        );

      case TEMPLATE_TYPES.PROGRAMMATIC:
        return (
          <>
            <th className={`${tableStyles.th} w-12`}>Line</th>
            <th className={`${tableStyles.th} w-28`}>Start Date</th>
            <th className={`${tableStyles.th} w-28`}>End Date</th>
            <th className={`${tableStyles.th} w-28`}>Budget</th>
            <th className={`${tableStyles.th} w-28`}>Impressions</th>
            <th className={`${tableStyles.th} w-32`}>Traffic Budget</th>
            <th className={`${tableStyles.th} w-36`}>Traffic Impressions</th>
            <th className={`${tableStyles.th} w-32`}>Actions</th>
          </>
        );

      case TEMPLATE_TYPES.YOUTUBE:
        return (
          <>
            <th className={`${tableStyles.th} w-12`}>Line</th>
            <th className={`${tableStyles.th} w-28`}>Flight Start</th>
            <th className={`${tableStyles.th} w-28`}>Flight End</th>
            <th className={`${tableStyles.th} w-28`}>Total Views</th>
            <th className={`${tableStyles.th} w-28`}>Days in Flight</th>
            <th className={`${tableStyles.th} w-28`}>Daily Views</th>
            <th className={`${tableStyles.th} w-36`}>Daily Platform Budget</th>
            <th className={`${tableStyles.th} w-28`}>Total Retail</th>
            <th className={`${tableStyles.th} w-32`}>Actions</th>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <thead>
      <tr className="bg-gray-50">
        {renderHeaders()}
      </tr>
    </thead>
  );
}
