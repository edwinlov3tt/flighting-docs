// Vercel serverless function for Tactics API proxy

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
        const apiUrl = 'https://ignite.edwinlovett.com/kpi/api.php?action=get_tactics';

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Error fetching tactics:', error);
        return res.status(500).json({
            error: 'Failed to fetch tactics',
            message: error.message
        });
    }
}
