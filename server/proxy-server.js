const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3003;

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);

    // Proxy endpoint for tactics API
    if (parsedUrl.pathname === '/api/tactics') {
        const apiUrl = 'https://ignite.edwinlovett.com/kpi/api.php?action=get_tactics';

        https.get(apiUrl, (apiRes) => {
            let data = '';

            apiRes.on('data', (chunk) => {
                data += chunk;
            });

            apiRes.on('end', () => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        }).on('error', (error) => {
            console.error('Error fetching from API:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch tactics' }));
        });
    }
    // Proxy endpoint for order API
    else if (parsedUrl.pathname.startsWith('/api/order')) {
        const query = parsedUrl.query.query || '';
        const type = parsedUrl.query.type || '';

        let apiUrl = `https://api.edwinlovett.com/order?query=${query}`;
        if (type) {
            apiUrl += `&type=${type}`;
        }

        https.get(apiUrl, (apiRes) => {
            let data = '';

            apiRes.on('data', (chunk) => {
                data += chunk;
            });

            apiRes.on('end', () => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        }).on('error', (error) => {
            console.error('Error fetching from order API:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch order data' }));
        });
    }
    // Health check endpoint
    else if (parsedUrl.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`   Tactics API: http://localhost:${PORT}/api/tactics`);
    console.log(`   Order API: http://localhost:${PORT}/api/order?query=ORDER_ID`);
});
