# AI-Driven Medical Report & Prescription Analyzer

## Overview

This is a full-stack AI-powered healthcare platform that enables patients to upload and analyze medical reports and prescriptions, while allowing doctors to review patient data and provide consultations. The system uses OCR to extract text from documents, AI (Google Gemini) to analyze and interpret medical data, and provides health tracking, visualizations, and reminder functionality. The platform bridges the gap between complex medical reports and patient understanding through automated analysis and simple explanations.

## Recent Changes (September 30, 2025)

- **Backend Implementation Complete**: Fully functional Flask REST API with OCR and AI analysis
- **Security Enhancements**: Firebase Authentication enforced on all endpoints with token revocation checking
- **Storage Optimization**: Blob paths stored in Firestore with on-demand signed URL generation (15-minute expiration)
- **Production-Ready Configuration**: Debug mode controlled by environment variable, configurable CORS
- **API Endpoints Deployed**: POST /upload, GET /reports/<user_id>, GET /report/<report_id> running on port 8000

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React/Next.js for building patient and doctor dashboards
- **Styling**: TailwindCSS/SCSS for responsive UI components
- **Visualization**: Recharts or Chart.js for health trend graphs and progress tracking
- **Key Pages**: 
  - Landing page with platform overview
  - Patient dashboard for uploads, analysis viewing, and timeline
  - Doctor dashboard for patient report review and feedback
  - History page for past reports and AI summaries
  - Profile page for user settings and notifications

### Backend Architecture
- **Framework**: Flask (Python) REST API server
- **File Processing Pipeline**:
  - File upload handling with security validation (10MB limit, specific file types)
  - OCR text extraction using Tesseract for images and PDFs
  - AI-powered analysis using Google Gemini for medical interpretation
  - Utility module (`utils.py`) separates OCR and AI logic from API endpoints
- **CORS Configuration**: Configurable allowed origins for frontend communication
- **File Storage**: Local uploads folder with secure filename handling

### Authentication & Authorization
- **Firebase Authentication**: Handles secure user login for both patients and doctors
- **Role-Based Access**: Separate dashboards and permissions for patient vs doctor roles
- **Token-Based Security**: Authorization headers for API requests

### Data Storage
- **Firestore Database**: NoSQL document database for:
  - User profiles (patients and doctors)
  - Medical reports metadata and analysis results
  - Health timeline data
  - Doctor-patient relationships
  - Reminders and notifications
- **Firebase Cloud Storage**: Stores uploaded medical documents (PDFs, images)
- **Local Temporary Storage**: Uploads folder for processing files before cloud storage

### AI & OCR Processing
- **OCR Engine**: Tesseract for text extraction from medical documents
- **PDF Processing**: pdf2image for converting PDF pages to images before OCR
- **AI Analysis**: Google Gemini API for:
  - Interpreting extracted medical data
  - Identifying abnormal values
  - Generating patient-friendly explanations
  - Summarizing complex medical information
- **Design Decision**: Separation of OCR and AI logic into `utils.py` allows for easier testing and potential swapping of AI providers

### Notification System
- **Firebase Cloud Messaging**: Handles push notifications for:
  - Medicine reminders
  - Test/checkup reminders
  - Doctor notifications for new patient uploads
  - Patient notifications for doctor feedback

## External Dependencies

### Third-Party Services
- **Firebase Suite**:
  - Firebase Authentication (user management)
  - Firestore (database)
  - Firebase Cloud Storage (file storage)
  - Firebase Cloud Messaging (notifications)
  - Firebase Admin SDK for backend operations
- **Google Gemini AI**: Medical report analysis and natural language processing
- **Tesseract OCR**: Open-source optical character recognition engine

### Python Libraries
- **Flask 3.0.0**: Web framework
- **Flask-CORS 4.0.0**: Cross-origin resource sharing
- **pytesseract 0.3.10**: Tesseract OCR wrapper
- **pdf2image 1.17.0**: PDF to image conversion
- **Pillow 10.2.0**: Image processing
- **google-genai 1.0.0**: Google Gemini API client
- **firebase-admin 6.4.0**: Firebase backend SDK
- **python-dotenv 1.0.0**: Environment variable management
- **Werkzeug 3.0.1**: WSGI utilities

### Environment Configuration
- **Required Environment Variables**:
  - `GEMINI_API_KEY`: Google Gemini API authentication
  - `ALLOWED_ORIGINS`: CORS configuration for frontend URLs
  - Firebase credentials (configured through Firebase Admin SDK)

### System Requirements
- Tesseract OCR must be installed on the system (not just the Python wrapper)
- Poppler utilities required for PDF processing (dependency of pdf2image)