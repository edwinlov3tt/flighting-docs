// Centralized configuration for Media Flight Planning App
// This file provides a single place to manage all environment-specific settings

const CONFIG = {
    // Development/Local settings (default)
    development: {
        APP_URL: 'http://localhost:8000',
        EXCEL_EXPORT_URL: 'http://localhost:3002',
        TACTICS_API_URL: 'https://ignite.edwinlovett.com/kpi/api.php'
    },

    // Production settings (Vercel deployment)
    production: {
        APP_URL: '', // Will be auto-detected from window.location
        EXCEL_EXPORT_URL: '/api/excel-export', // Vercel serverless function
        TACTICS_API_URL: 'https://ignite.edwinlovett.com/kpi/api.php'
    }
};

// Determine environment (can be set via URL parameter or default to development)
const getEnvironment = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const env = urlParams.get('env');

    // Check if we're running locally
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'development';
    }

    // Otherwise assume production
    return env || 'production';
};

// Export configuration based on current environment
const ENV = getEnvironment();
const AppConfig = CONFIG[ENV] || CONFIG.development;

// Make config globally available
window.AppConfig = AppConfig;

console.log(`Running in ${ENV} mode`, AppConfig);