// Vercel serverless function for Lumina Order API proxy

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query, type } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter required' });
        }

        let apiUrl = `https://api.edwinlovett.com/order?query=${encodeURIComponent(query)}`;
        if (type) {
            apiUrl += `&type=${encodeURIComponent(type)}`;
        }

        console.log('Fetching from Lumina API:', apiUrl);

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Error fetching order data:', error);
        return res.status(500).json({
            error: 'Failed to fetch order data',
            message: error.message
        });
    }
}
