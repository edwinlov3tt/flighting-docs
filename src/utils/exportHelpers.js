/**
 * Export Utilities
 *
 * Helpers for exporting campaign data to CSV and Excel
 */

/**
 * Export campaign to CSV
 * @param {Object} campaign - Campaign object with flights and template type
 */
export const exportToCSV = (campaign) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const headers = ['Line', 'Start Date', 'End Date', 'Budget'];

  if (campaign.templateType === 'programmatic') {
    headers.push('Impressions', 'Traffic Budget', 'Traffic Impressions');
  } else if (campaign.templateType === 'youtube') {
    headers.push('Total Views', 'Days in Flight', 'Daily Views', 'Daily Platform Budget', 'Total Retail');
  }

  const csvContent = [
    headers.join(','),
    ...campaign.flights.map(flight => {
      const row = [
        flight.line,
        formatDate(flight.startDate),
        formatDate(flight.endDate),
        flight.budget.toFixed(2)
      ];

      if (campaign.templateType === 'programmatic') {
        row.push(
          flight.impressions?.toLocaleString() || '',
          flight.trafficBudget?.toFixed(2) || '',
          flight.trafficImpressions?.toLocaleString() || ''
        );
      } else if (campaign.templateType === 'youtube') {
        row.push(
          flight.totalViews?.toLocaleString() || '',
          flight.daysInFlight || '',
          flight.dailyViews?.toFixed(2) || '',
          flight.dailyPlatformBudget?.toFixed(2) || '',
          flight.totalRetail?.toFixed(2) || ''
        );
      }

      return row.join(',');
    })
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${campaign.name.replace(/[^a-z0-9]/gi, '_')}_flight_plan.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
