/**
 * useTactics Hook
 *
 * Manages tactic data fetching from API with fallback to defaults
 * Handles loading states and error handling
 *
 * Returns:
 * - tactics: array - Available tactics
 * - loading: boolean - Loading state
 * - error: string - Error message if fetch failed
 */

import { useState, useEffect } from 'react';
import { defaultTacticData } from '../utils/constants';

// Map API tactic to internal structure
const mapTactic = (tactic) => {
  let category = 'Programmatic'; // default
  let product = tactic.name || '';
  let subProduct = '';

  if (tactic.name) {
    // Handle Email Marketing
    if (tactic.name.toLowerCase().includes('email')) {
      category = 'Email Marketing';
      product = 'Email Marketing';
      if (tactic.name.includes('1:1')) {
        subProduct = '1:1 Marketing';
      } else if (tactic.name.includes('B2B')) {
        subProduct = 'B2B (Business Targeting)';
      } else if (tactic.name.includes('B2C')) {
        subProduct = 'B2C (Consumer Targeting)';
      } else {
        subProduct = tactic.name.replace('Email Marketing', '').trim();
      }
    }
    // Handle Social Media
    else if (
      tactic.name.toLowerCase().includes('meta') ||
      tactic.name.toLowerCase().includes('facebook') ||
      tactic.name.toLowerCase().includes('instagram')
    ) {
      category = 'Social';
      if (tactic.name.toLowerCase().includes('facebook')) {
        product = 'Meta';
        subProduct = 'Facebook';
      } else if (tactic.name.toLowerCase().includes('instagram')) {
        product = 'Meta';
        subProduct = 'Instagram';
      } else {
        product = 'Meta';
        subProduct = tactic.name.replace('Meta', '').trim() || 'Standard';
      }
    } else if (
      tactic.name.toLowerCase().includes('snapchat') ||
      tactic.name.toLowerCase().includes('tiktok') ||
      tactic.name.toLowerCase().includes('twitter') ||
      tactic.name.toLowerCase().includes('pinterest') ||
      tactic.name.toLowerCase().includes('linkedin')
    ) {
      category = 'Social';
      if (tactic.name.toLowerCase().includes('snapchat')) product = 'Snapchat';
      else if (tactic.name.toLowerCase().includes('tiktok')) product = 'TikTok';
      else if (tactic.name.toLowerCase().includes('twitter')) product = 'Twitter';
      else if (tactic.name.toLowerCase().includes('pinterest')) product = 'Pinterest';
      else if (tactic.name.toLowerCase().includes('linkedin')) product = 'LinkedIn';
      subProduct = 'Standard';
    }
    // Handle YouTube
    else if (tactic.name.toLowerCase().includes('youtube')) {
      category = 'Programmatic';
      product = 'YouTube';
      if (tactic.name.toLowerCase().includes('trueview')) {
        subProduct = 'TrueView';
      } else if (tactic.name.toLowerCase().includes('bumper')) {
        subProduct = 'Bumper';
      } else if (tactic.name.toLowerCase().includes('shorts')) {
        subProduct = 'Shorts';
      } else {
        subProduct = 'Standard';
      }
    }
    // Handle Google/SEM
    else if (
      tactic.name.toLowerCase().includes('sem') ||
      tactic.name.toLowerCase().includes('google')
    ) {
      category = 'Google';
      if (tactic.name.toLowerCase().includes('sem')) {
        product = 'SEM';
        if (tactic.name.toLowerCase().includes('search')) {
          subProduct = 'Search';
        } else if (tactic.name.toLowerCase().includes('display')) {
          subProduct = 'Display';
        } else {
          subProduct = 'Search';
        }
      } else if (tactic.name.toLowerCase().includes('spark')) {
        product = 'Spark';
        subProduct = 'Standard';
      } else {
        product = tactic.name.includes('SEM') ? 'SEM' : 'Google';
        subProduct = 'Standard';
      }
    }
    // Handle Programmatic
    else if (tactic.name.toLowerCase().includes('programmatic')) {
      category = 'Programmatic';
      if (tactic.name.toLowerCase().includes('audio')) {
        product = 'Programmatic Audio';
        if (tactic.name.includes('AAT')) {
          subProduct = 'AAT';
        } else if (tactic.name.includes('RON')) {
          subProduct = 'RON';
        } else {
          subProduct = 'Standard';
        }
      } else if (tactic.name.toLowerCase().includes('addressable')) {
        product = 'Addressable Solutions';
        if (tactic.name.includes('CTV')) {
          subProduct = 'CTV';
        } else if (tactic.name.includes('Local CTV')) {
          subProduct = 'Local CTV';
        } else {
          subProduct = 'Standard';
        }
      } else if (tactic.name.toLowerCase().includes('blended')) {
        product = 'Blended Tactics';
        subProduct = 'Standard';
      } else if (tactic.name.toLowerCase().includes('stv')) {
        product = 'STV';
        subProduct = 'Local';
      } else {
        const parts = tactic.name.split(' - ');
        product = parts[0] || tactic.name;
        subProduct = parts[1] || 'Standard';
      }
    }
    // Handle Local Display
    else if (
      tactic.name.toLowerCase().includes('display') ||
      tactic.name.toLowerCase().includes('takeover') ||
      tactic.name.toLowerCase().includes('sponsorship')
    ) {
      category = 'Local Display';
      if (tactic.name.toLowerCase().includes('takeover')) {
        product = 'Takeovers';
        subProduct = 'Homepage';
      } else if (tactic.name.toLowerCase().includes('sponsorship')) {
        product = 'Sponsorship';
        subProduct = 'Standard';
      } else {
        product = 'CPM Display';
        subProduct = 'Standard';
      }
    }
    // Generic parsing for others
    else {
      const parts = tactic.name.split(' - ');
      if (parts.length >= 2) {
        product = parts[0];
        subProduct = parts[1];
      } else {
        product = tactic.name;
        subProduct = 'Standard';
      }
    }
  }

  // Format the rate value
  let rate = '$0.00';
  if (tactic.value) {
    const numValue = parseFloat(tactic.value);
    if (!isNaN(numValue)) {
      rate = `$${numValue.toFixed(2)}`;
    }
  }

  // Determine KPI type from API type field
  let kpi = tactic.type || 'CPM';
  if (kpi === 'CPV' || (product === 'YouTube' && subProduct === 'TrueView')) {
    kpi = 'CPV';
  } else if (product === 'SEM' && subProduct === 'Search') {
    kpi = 'CPLC';
  }

  return {
    category,
    product,
    subProduct,
    rate,
    kpi,
    originalName: tactic.name // Keep original for debugging
  };
};

export function useTactics() {
  const [tactics, setTactics] = useState(defaultTacticData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTactics = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/tactics');
        if (!response.ok) {
          throw new Error(`Failed to fetch tactics: ${response.status}`);
        }

        const apiTactics = await response.json();
        const mappedTactics = apiTactics.map(mapTactic);

        if (mappedTactics.length > 0) {
          setTactics(mappedTactics);
          console.log('✅ Loaded tactics from API');
        } else {
          console.warn('API returned no tactics, using defaults');
        }
      } catch (err) {
        console.warn('Failed to load tactics from API, using defaults:', err.message);
        // Keep using default tactics on error - no need to show error to user
      } finally {
        setLoading(false);
      }
    };

    fetchTactics();
  }, []);

  return { tactics, loading, error };
}
