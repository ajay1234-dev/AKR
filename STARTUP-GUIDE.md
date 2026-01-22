# AKR Workshop - Application Startup Guide

## Prerequisites

- Node.js installed on your system
- Expo Go app installed on your mobile device (from App Store or Google Play)

## Environment Configuration

The application is already configured with:

- Backend server running on `http://0.0.0.0:3000` (accessible from any device on the same network)
- Frontend configured to connect to the backend via the `.env` file

## Automatic Startup (Recommended)

### Windows Users:

1. Double-click the `start-app.ps1` file
2. This will automatically start both the backend and frontend in separate terminal windows
3. The QR code for mobile access will appear in the frontend terminal

## Manual Startup

### Option 1: Separate Terminals

1. **Terminal 1** - Start the backend server:

   ```bash
   cd server
   node server.js
   ```

2. **Terminal 2** - Start the mobile app:
   ```bash
   npm run start
   ```

### Option 2: Using npm script

From the main project directory, run:

```bash
npm run dev
```

This will start both the backend and frontend concurrently.

## Connecting Your Mobile Device

1. Make sure your mobile device is connected to the same WiFi network as your computer
2. Open the Expo Go app on your mobile device
3. Scan the QR code that appears in the terminal after running `npm run start`
4. The app should load and connect to your backend server

## Troubleshooting

- **Can't connect from mobile device?** Ensure both devices are on the same network and the backend server shows "Accepting connections from any IP"
- **QR code not working?** Try using the tunnel option by pressing `t` in the Expo terminal
- **API calls failing?** Check that the `EXPO_PUBLIC_API_URL` in the root `.env` file matches your computer's IP address

## Notes

- The backend server binds to `0.0.0.0:3000` to accept connections from any IP on the local network
- The frontend is mobile-only (Android/iOS) with web support disabled
- SQLite is used for offline storage and will work on mobile devices
- The app is designed to work even when backend is temporarily unavailable
