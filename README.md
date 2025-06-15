# CareTrax - Local Server Setup

## Quick Start

### 1. Start the Python Server

\`\`\`bash
python server.py
\`\`\`

The server will print its URL, for example:
\`\`\`
📡 Server URL: http://192.168.1.100:8000
📊 Weight endpoint: http://192.168.1.100:8000/weight
\`\`\`

### 2. Configure the App

1. Open `config/server-config.ts`
2. Replace the `BASE_URL` with your server's URL:

\`\`\`typescript
export const SERVER_CONFIG = {
  BASE_URL: "http://YOUR_SERVER_IP:8000", // Paste your server URL here
  // ...
};
\`\`\`

### 3. Run the App

Your existing workflow remains the same:
- Enable developer mode on phone
- Pair with VS Code terminal
- Run the app as usual

## What Changed

- **Removed**: All Firebase dependencies
- **Added**: Local HTTP server integration
- **Same**: All UI, navigation, and styling remain identical

## Server Endpoints

- `POST /` - Receives weight data from hardware
- `GET /weight` - Returns current weight as JSON

## Weight Data Format

\`\`\`json
{
  "weight": 1.234,
  "timestamp": "2025-01-08T10:30:00.000Z"
}
\`\`\`

The app automatically polls this endpoint every 2 seconds and updates the UI in real-time.
\`\`\`

The existing CareTrax app now uses your local Python server instead of Firebase. The UI and all functionality remain exactly the same - only the data source has changed. Just start the Python server, update the URL in the config file, and run your app as usual!
