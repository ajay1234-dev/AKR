# Mechanic Workshop Billing App - Deployment Guide

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Android device or emulator for testing
- Expo CLI (optional, for development)

## Backend Setup

### 1. Database Setup

1. Install PostgreSQL on your server
2. Create a new database for the application:
   ```sql
   CREATE DATABASE mechanic_workshop;
   ```

### 2. Backend Configuration

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/mechanic_workshop?schema=public"
   PORT=5000
   ```

4. Run Prisma migrations:

   ```bash
   npx prisma migrate dev
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

## Frontend Setup

### 1. Frontend Configuration

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Update the API base URL in `frontend/src/utils/api.js` to match your backend server:
   ```javascript
   const API_BASE_URL = "http://your-server-ip:5000/api";
   ```

### 2. Running the App

For development:

```bash
npx expo start
```

For Android build:

```bash
npx expo build:android
```

Or to run directly on Android device:

```bash
npx expo start --android
```

## Production Deployment

### Backend (Production)

1. For production deployment of the backend, use a process manager like PM2:

   ```bash
   npm install -g pm2
   pm2 start src/server.js --name "mechanic-workshop"
   ```

2. Set up environment variables for production:
   ```
   DATABASE_URL="postgresql://username:password@production-db:5432/mechanic_workshop"
   PORT=5000
   NODE_ENV=production
   ```

### Frontend (Production)

1. To build the app for production:

   ```bash
   npx expo build:android
   ```

2. Or eject to bare workflow for more control:
   ```bash
   npx expo eject
   ```

## Environment Configuration

### Backend Environment Variables

- `DATABASE_URL` - PostgreSQL database connection string
- `PORT` - Server port (default: 5000)

### Frontend Configuration

- Update `API_BASE_URL` in `src/utils/api.js` to point to your backend server
- For local testing, use your computer's IP address instead of localhost

## Troubleshooting

### Common Issues

1. **Voice Recognition Not Working**: Ensure microphone permissions are granted
2. **Database Connection Issues**: Verify database credentials in `.env` file
3. **API Connection Issues**: Check that backend server is running and accessible
4. **WhatsApp Sharing Not Working**: Ensure WhatsApp is installed on the device

### API Endpoints

- `POST /api/bills` - Create new bill
- `GET /api/bills` - Get all bills
- `GET /api/bills/:id` - Get specific bill
- `GET /api/customers` - Get all customers

## Security Considerations

- Use HTTPS in production
- Implement proper authentication if needed
- Secure database credentials
- Validate all inputs on the server side
