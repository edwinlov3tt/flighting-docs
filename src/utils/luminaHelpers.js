/**
 * Lumina Import Utilities
 *
 * Handles parsing and importing campaign data from Lumina orders/lineitems
 */

import { formatDateForInput } from './formatters';
import { gracefulRound } from './calculations';

// Extract ID and type from Lumina link
export const extractLuminaInfo = (link) => {
  if (!link) return { id: '', type: 'order' };

  // Check for order URL
  const orderRegex = /https:\/\/townsquarelumina\.com\/lumina\/view\/order\/([a-f0-9]+)/;
  const orderMatch = link.match(orderRegex);
  if (orderMatch) {
    return { id: orderMatch[1], type: 'order' };
  }

  // Check for lineitem URL
  const lineitemRegex = /https:\/\/townsquarelumina\.com\/lumina\/view\/lineitem\/[^/]+\/([a-f0-9]+)/;
  const lineitemMatch = link.match(lineitemRegex);
  if (lineitemMatch) {
    return { id: lineitemMatch[1], type: 'lineitem' };
  }

  return { id: '', type: 'order' };
};

// Fetch order/lineitem data from API
export const fetchLuminaData = async (id, type) => {
  try {
    const apiUrl = type === 'lineitem'
      ? `/api/order?query=${encodeURIComponent(id)}&type=lineitem`
      : `/api/order?query=${encodeURIComponent(id)}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch Lumina data');
  }
};

// Process lumina data and extract tactics
export const processLuminaData = (luminaData) => {
  if (!luminaData) return [];

  let lineItems = [];

  // Handle different response types
  if (luminaData.type === 'lineitem') {
    // Single line item response
    lineItems = [luminaData.lineItem];
  } else if (luminaData.type === 'order') {
    // Order response with multiple line items
    lineItems = luminaData.lineItems || [];
  } else {
    // Legacy format (fallback)
    lineItems = luminaData.lineItems || [];
  }

  return lineItems.map((lineItem, index) => {
    const product = lineItem.product || '';
    const subProduct = lineItem.subProduct?.[0] || lineItem.subProduct || '';

    return {
      id: lineItem.lineitemId || `order-tactic-${index}`,
      status: lineItem.status || '',
      startDate: lineItem.startDate ? formatDateForInput(lineItem.startDate) : '',
      endDate: lineItem.endDate ? formatDateForInput(lineItem.endDate) : '',
      product: product,
      subProduct: subProduct,
      totalBudget: lineItem.totalBudget || lineItem.adjustedTotalBudget || 0,
      contractedKpiGoal: lineItem.contractedKpiGoal || lineItem.cbContractedItems || 0,
      contractedImpressions: lineItem.contractedImpressions || lineItem.contractedEmailRecords || 0,
      tacticTypeSpecial: lineItem.tacticTypeSpecial?.[0] || '',
      cpm: lineItem.cpm || lineItem.cpmEmailDrop || 0,
      kpi: lineItem.kpi || 'CPM',
      displayName: lineItem.displayName || `${product} - ${subProduct}`,
      selected: true
    };
  }).filter(tactic => tactic.product && tactic.totalBudget > 0);
};

// Determine template type from Lumina tactic
export const getTemplateTypeFromLuminaTactic = (tactic) => {
  if (tactic.product === 'YouTube') return 'youtube';
  if (tactic.product === 'SEM' || tactic.product === 'Meta' || tactic.product === 'Spark') return 'sem-social';
  return 'programmatic';
};
