#!/bin/bash

echo "🚀 Starting all servers for Media Flight Planner..."
echo ""

# Start proxy server in background
echo "📡 Starting API proxy server (port 3003)..."
node server/proxy-server.js &
PROXY_PID=$!

# Wait a moment
sleep 1

# Start export server in background
echo "📊 Starting Excel export server (port 3001)..."
node server/excel-export-server.js &
EXPORT_PID=$!

# Wait a moment
sleep 1

# Start main web server in foreground
echo "🌐 Starting web server (port 8000)..."
echo ""
echo "✅ All servers running!"
echo "   Main app: http://localhost:8000"
echo "   Proxy API: http://localhost:3003"
echo "   Export API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all servers..."
    kill $PROXY_PID $EXPORT_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start web server
python3 -m http.server 8000
