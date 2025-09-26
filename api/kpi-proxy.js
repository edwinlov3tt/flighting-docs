// KPI API Proxy for CORS bypass
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get query parameters from the request
        const { action = 'get_tactics' } = req.query;

        // Fetch data from the KPI API (server-side, no CORS restrictions)
        const response = await fetch(`https://ignite.edwinlovett.com/kpi/api.php?action=${action}`);

        if (!response.ok) {
            throw new Error(`KPI API error: ${response.status}`);
        }

        const data = await response.json();

        // Return the data with CORS headers
        res.json(data);

    } catch (error) {
        console.error('KPI API proxy error:', error);
        res.status(500).json({
            error: 'Failed to fetch KPI data',
            message: error.message
        });
    }
}