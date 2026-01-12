# Mechanic Workshop Billing App

A simple Android-first mobile application for a mechanic workshop owner who is poor in reading and typing. The app features voice input for work descriptions and spare parts, with manual typing only required for amounts.

## Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Voice Recognition**: @react-native-voice/voice

## Features

### Core Features

1. **New Bill Creation**

   - Voice input for customer name and vehicle number
   - Voice input for work descriptions and spare parts
   - Manual typing for amounts only
   - Add advance amount (optional)
   - Automatic calculation of total and balance amounts

2. **Bill Storage**

   - Every bill saved in PostgreSQL database
   - Complete bill history with customer details
   - Works, spare parts, and amounts stored separately

3. **Old Bills**
   - View previous bills in a list
   - Tap a bill to view full details

### UI/UX Features

- Large buttons for easy use
- Minimal text, icon-based navigation
- Simple, intuitive interface
- Voice input for all text entry except amounts
- Local language support ready

## Database Schema

### Customers Table

- id (String, cuid)
- name (String)
- vehicleNumber (String)
- createdAt (DateTime)
- updatedAt (DateTime)

### Bills Table

- id (String, cuid)
- billNumber (String, unique)
- date (DateTime)
- customerId (String, foreign key)
- advanceAmount (Float)
- totalAmount (Float)
- balanceAmount (Float)
- createdAt (DateTime)
- updatedAt (DateTime)

### BillItems Table

- id (String, cuid)
- billId (String, foreign key)
- description (String)
- itemType (String) - "work" or "sparePart"
- amount (Float)
- createdAt (DateTime)
- updatedAt (DateTime)

## Backend API Endpoints

### Bills

- `POST /api/bills` - Create a new bill
- `GET /api/bills` - Get all bills
- `GET /api/bills/:id` - Get a specific bill

### Customers

- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get a specific customer

## Frontend Screens

### Main Screens

1. **Home Screen** - Main navigation hub
2. **Create Bill Screen** - Voice-enabled bill creation
3. **Bill List Screen** - View previous bills
4. **Bill Detail Screen** - Detailed view of a specific bill

### Voice Input Implementation

- Voice recognition for customer name, vehicle number, work descriptions, and spare parts
- Real-time display of recognized text
- Visual feedback during recording
- Easy re-recording option

## Installation & Setup

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up PostgreSQL database and update the `.env` file with your database credentials:

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

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the Expo development server:

   ```bash
   npx expo start
   ```

4. Scan the QR code with the Expo Go app on your Android device

## Usage Instructions

### Creating a New Bill

1. Tap "Create New Bill" on the home screen
2. Speak customer name and vehicle number
3. Add works and spare parts by speaking their descriptions
4. Manually enter amounts for each item
5. Optionally enter advance amount
6. Review and tap "CREATE BILL"

### Viewing Previous Bills

1. Tap "View Previous Bills" on the home screen
2. Scroll through the list of bills
3. Tap any bill to view its details

## Security Considerations

- Voice input is processed locally on the device
- No sensitive data is sent to external services for processing
- All data is stored securely in the local database

## Android-Specific Features

- Optimized for Android devices
- Large touch targets for easy interaction
- Voice input optimized for various accents
- Offline capability planned for future releases

## Future Enhancements

- WhatsApp integration for sending bills
- Offline mode with sync capability
- Multi-language support
- Barcode scanning for spare parts
- Print functionality for physical receipts

## Troubleshooting

### Voice Recognition Issues

- Ensure microphone permissions are granted
- Check that the device has a working microphone
- Try speaking clearly in a quiet environment

### Connection Issues

- Verify backend server is running
- Check network connectivity
- Update API base URL in the frontend if needed

## Notes for Workshop Owner

This application is designed specifically for mechanics who may have difficulty reading or typing. The interface is kept simple with:

- Large, clearly labeled buttons
- Voice input for all text entry except amounts
- Minimal cognitive load
- Clear visual feedback for all actions

Remember to speak clearly when using voice input, and double-check amounts before creating bills.
