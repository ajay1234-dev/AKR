# AKR Workshop - Mechanic Management System

## Architecture Overview

This is a full-stack mobile application with proper separation of concerns:

### Mobile App (Frontend)

- **Framework**: Expo SDK 54 (React Native)
- **Data Storage**: SQLite (offline-first)
- **Communication**: REST API calls to backend
- **Features**: Text-to-Speech, offline capability, sync service

### Backend API Server

- **Framework**: Node.js + Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Independent server process
- **APIs**: CRUD operations for customers, bills, and bill items

## Setup Instructions

### Prerequisites

1. Node.js (v18 or higher)
2. PostgreSQL database
3. Expo Go app on your mobile device
4. Computer and mobile device on same WiFi network

### Backend Setup

1. **Navigate to server directory:**

```bash
cd server
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure database:**

   - Edit `server/.env` with your PostgreSQL connection string
   - Example: `DATABASE_URL="postgresql://username:password@localhost:5432/akr_workshop"`

4. **Generate Prisma client:**

```bash
npx prisma generate
```

5. **Run database migrations:**

```bash
npx prisma migrate dev --name init
```

6. **Start the backend server:**

```bash
npm start
# or for development with auto-reload:
npm run dev
```

### Mobile App Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Configure API URL:**

   - Edit `.env` file with your computer's local IP address
   - Example: `EXPO_PUBLIC_API_URL=http://192.168.1.100:3000`
   - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

3. **Start Expo development server:**

```bash
npm start
# or
npx expo start
```

4. **Connect mobile device:**
   - Open Expo Go app on your phone
   - Scan the QR code displayed in terminal
   - Ensure phone and computer are on same WiFi network

## Running Both Services Together

For development convenience, you can run both services simultaneously:

```bash
# Install concurrently if not already installed
npm install -g concurrently

# Run both backend and mobile app
npm run dev
```

This will start:

- Backend API server on port 3000
- Expo development server for mobile app

## PostgreSQL Database Connection Error Resolution

If you encounter the error "The table `public.Bill` does not exist in the current database" when running Prisma Studio, follow these steps:

### Quick Fix Commands:

```bash
# Navigate to server directory
cd server

# Generate Prisma client (if not already done)
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Now you can run Prisma Studio
npx prisma studio
```

### Alternative Solutions:

1. **Run the provided script:**

   ```bash
   # On Windows
   .\fix-database.bat

   # Or using PowerShell
   .\fix-database.ps1
   ```

2. **Manual Verification:**
   - Ensure PostgreSQL is running
   - Check `server/.env` has correct database credentials
   - Verify database `akr_workshop` exists in PostgreSQL

### Common Causes:

- Database migrations not run after schema changes
- PostgreSQL service not running
- Incorrect database credentials in `.env` file
- Database doesn't exist

## Database Management

### Using Prisma Studio

```bash
cd server
npx prisma studio
```

This opens a web interface to view and edit your PostgreSQL data.

### Reset Database (Development Only)

```bash
cd server
npx prisma migrate reset
```

## API Endpoints

### Customers

- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Bills

- `GET /api/bills` - Get all bills
- `POST /api/bills` - Create new bill
- `GET /api/bills/:id` - Get bill by ID
- `PUT /api/bills/:id` - Update bill
- `DELETE /api/bills/:id` - Delete bill

### Health Check

- `GET /api/health` - Check server status

## Troubleshooting

### Common Issues

1. **Mobile app can't connect to backend:**

   - Verify your computer's IP address in `.env` file
   - Ensure both devices are on same network
   - Check firewall settings

2. **Database connection failed:**

   - Verify PostgreSQL is running
   - Check connection string in `server/.env`
   - Ensure database exists

3. **Prisma errors:**

   - Run `npx prisma generate` after schema changes
   - Run `npx prisma migrate dev` after adding migrations

4. **Expo build issues:**
   - Clear cache: `npx expo start --clear`
   - Restart development server

### Network Configuration

- Backend binds to `0.0.0.0` to accept connections from any IP
- Mobile app uses local IP address for API calls
- No tunneling required - direct LAN connection

## Production Deployment

### Backend

1. Set `NODE_ENV=production` in environment
2. Use process manager like PM2
3. Configure reverse proxy (nginx/Apache)
4. Set up SSL certificate

### Mobile App

1. Build standalone APK/IPA
2. Deploy to app stores
3. Update API URL to production endpoint

## Security Considerations

- Never commit `.env` files to version control
- Use environment variables for secrets
- Implement proper authentication for production
- Add rate limiting and input validation
- Use HTTPS in production

## Folder Structure

```
AKR/
├── app/                 # Mobile app screens
│   ├── _layout.tsx     # Root layout
│   ├── index.tsx       # Home screen
│   ├── create-bill.tsx # Bill creation
│   ├── bills-list.tsx  # Bills listing
│   └── bill-detail.tsx # Bill details
├── services/           # Mobile services
│   ├── api.ts         # API service
│   ├── offlineStorage.ts # SQLite storage
│   └── syncService.ts # Sync management
├── utils/             # Utility functions
│   └── apiConfig.ts   # API configuration
├── server/            # Backend server
│   ├── routes/        # API routes
│   ├── prisma/        # Database schema
│   ├── server.js      # Main server file
│   └── .env           # Server environment
├── package.json       # Mobile dependencies
└── .env               # Mobile environment
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - see LICENSE file for details
