"""
Flask Backend for AI-Driven Medical Report & Prescription Analyzer
Handles file uploads, OCR extraction, AI analysis, and Firebase integration
"""

import os
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
from google.cloud.firestore_v1.base_query import FieldFilter
from dotenv import load_dotenv

# Import utility functions
from utils import process_uploaded_file

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for frontend integration
# For production, restrict to specific frontend origin
allowed_origins = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
CORS(app, resources={
    r"/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize Firebase Admin SDK
try:
    # Using Firebase credentials from environment variables
    private_key = os.environ.get("FIREBASE_PRIVATE_KEY")
    if private_key:
        private_key = private_key.replace('\\n', '\n')
    
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
        "private_key": private_key,
        "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
        "token_uri": "https://oauth2.googleapis.com/token",
    })
    
    firebase_admin.initialize_app(cred, {
        'storageBucket': f"{os.environ.get('FIREBASE_PROJECT_ID')}.appspot.com"
    })
    
    # Initialize Firestore and Storage clients
    db = firestore.client()
    bucket = storage.bucket()
    
    print("✅ Firebase initialized successfully")
except Exception as e:
    print(f"⚠️ Firebase initialization error: {str(e)}")
    db = None
    bucket = None


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify Firebase ID token and return decoded token with user info
    
    Args:
        id_token: Firebase ID token from Authorization header
        
    Returns:
        Decoded token dictionary with user information
        
    Raises:
        Exception: If token is invalid or revoked
    """
    try:
        # Verify token and check if it has been revoked
        decoded_token = auth.verify_id_token(id_token, check_revoked=True)
        return decoded_token
    except auth.RevokedIdTokenError:
        raise Exception("Token has been revoked")
    except Exception as e:
        raise Exception(f"Invalid authentication token: {str(e)}")


def get_authenticated_user() -> str:
    """
    Extract and verify user from Authorization header
    
    Returns:
        User ID (uid) from verified token
        
    Raises:
        Exception: If authentication fails
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise Exception("Missing or invalid Authorization header")
    
    id_token = auth_header.split('Bearer ')[1]
    decoded_token = verify_firebase_token(id_token)
    return decoded_token['uid']


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_to_firebase_storage(local_file_path: str, filename: str, user_id: str) -> str:
    """
    Upload file to Firebase Storage and return blob path
    
    Args:
        local_file_path: Path to local file
        filename: Name to use in Firebase Storage
        user_id: User ID for file path organization
        
    Returns:
        Blob path in storage (not a URL - signed URLs generated on retrieval)
    """
    try:
        if not bucket:
            return ""
        
        # Store files in user-specific folders for better organization and security
        blob_path = f"medical_reports/{user_id}/{filename}"
        blob = bucket.blob(blob_path)
        blob.upload_from_filename(local_file_path)
        
        # Return blob path instead of signed URL
        # Signed URLs will be generated on-demand when fetching reports
        return blob_path
    except Exception as e:
        print(f"Firebase Storage upload error: {str(e)}")
        return ""


def generate_signed_url(blob_path: str) -> str:
    """
    Generate a short-lived signed URL for a storage blob
    
    Args:
        blob_path: Path to blob in Firebase Storage
        
    Returns:
        Signed URL valid for 15 minutes
    """
    try:
        if not bucket or not blob_path:
            return ""
        
        from datetime import timedelta
        blob = bucket.blob(blob_path)
        
        # Generate signed URL valid for 15 minutes
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=15),
            method="GET"
        )
        
        return signed_url
    except Exception as e:
        print(f"Signed URL generation error: {str(e)}")
        return ""


def save_report_to_firestore(user_id: str, report_data: dict) -> str:
    """
    Save report data to Firestore
    
    Args:
        user_id: User's Firebase UID
        report_data: Dictionary containing report information
        
    Returns:
        Document ID of saved report
    """
    try:
        if not db:
            raise Exception("Database not available")
        
        doc_ref = db.collection('users').document(user_id).collection('reports').document()
        doc_ref.set(report_data)
        return doc_ref.id
    except Exception as e:
        print(f"Firestore save error: {str(e)}")
        raise Exception(f"Failed to save report to database: {str(e)}")


@app.route('/', methods=['GET'])
def index():
    """Health check endpoint"""
    return jsonify({
        "status": "running",
        "service": "Medical Report Analyzer API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "POST /upload",
            "user_reports": "GET /reports/<user_id>",
            "report_detail": "GET /report/<report_id>"
        }
    }), 200


@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Handle file upload, extract text using OCR, and analyze with AI
    
    Request:
        - Authorization header with Firebase ID token (required)
        - file: PDF or image file
        
    Returns:
        JSON with filename, extracted_text, ai_analysis, and report_id
    """
    try:
        # Authenticate user
        try:
            user_id = get_authenticated_user()
        except Exception as e:
            return jsonify({"error": str(e)}), 401
        
        # Validate file in request
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if not file.filename or file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({
                "error": f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}_{original_filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Save file temporarily
        file.save(file_path)
        
        # Process file: extract text and get AI analysis
        try:
            extracted_text, ai_analysis = process_uploaded_file(file_path, file_extension)
        except Exception as e:
            # Clean up temporary file
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({"error": f"Processing failed: {str(e)}"}), 500
        
        # Upload to Firebase Storage if available
        blob_path = ""
        if bucket:
            try:
                blob_path = upload_to_firebase_storage(file_path, unique_filename, user_id)
            except Exception as e:
                print(f"Storage upload warning: {str(e)}")
        
        # Save to Firestore if available
        report_id = ""
        if db:
            try:
                report_data = {
                    "filename": original_filename,
                    "blob_path": blob_path,  # Store blob path, not signed URL
                    "extracted_text": extracted_text,
                    "ai_analysis": ai_analysis,
                    "uploaded_at": datetime.utcnow().isoformat(),
                    "user_id": user_id
                }
                report_id = save_report_to_firestore(user_id, report_data)
            except Exception as e:
                print(f"Firestore save warning: {str(e)}")
        
        # Clean up temporary file
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Return response
        return jsonify({
            "success": True,
            "filename": original_filename,
            "extracted_text": extracted_text,
            "ai_analysis": ai_analysis,
            "report_id": report_id,
            "message": "File processed successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


@app.route('/reports/<user_id>', methods=['GET'])
def get_user_reports(user_id):
    """
    Get all reports for a specific user
    
    Args:
        user_id: Firebase user ID from URL
        
    Query Parameters:
        limit: Maximum number of reports to return (default: 50)
        
    Returns:
        JSON array of user's reports sorted by upload date (newest first)
    """
    try:
        # Authenticate user
        try:
            authenticated_uid = get_authenticated_user()
        except Exception as e:
            return jsonify({"error": str(e)}), 401
        
        # Verify that authenticated user matches requested user_id
        if authenticated_uid != user_id:
            return jsonify({"error": "Unauthorized: You can only access your own reports"}), 403
        
        if not db:
            return jsonify({"error": "Database not available"}), 503
        
        # Get limit parameter (default 50, max 100)
        limit = request.args.get('limit', 50, type=int)
        limit = min(limit, 100)
        
        # Query Firestore for user's reports
        reports_ref = db.collection('users').document(user_id).collection('reports')
        query = reports_ref.order_by('uploaded_at', direction=firestore.Query.DESCENDING).limit(limit)
        
        reports = []
        for doc in query.stream():
            report_data = doc.to_dict()
            report_data['report_id'] = doc.id
            
            # Generate fresh signed URL for file access (if blob_path exists)
            if 'blob_path' in report_data and report_data['blob_path']:
                report_data['file_url'] = generate_signed_url(report_data['blob_path'])
            
            reports.append(report_data)
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "count": len(reports),
            "reports": reports
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve reports: {str(e)}"}), 500


@app.route('/report/<report_id>', methods=['GET'])
def get_report_detail(report_id):
    """
    Get detailed information for a specific report
    
    Args:
        report_id: Document ID of the report
        
    Query Parameters:
        user_id: Firebase user ID (required for security)
        
    Returns:
        JSON with complete report details including AI analysis
    """
    try:
        # Authenticate user
        try:
            authenticated_uid = get_authenticated_user()
        except Exception as e:
            return jsonify({"error": str(e)}), 401
        
        if not db:
            return jsonify({"error": "Database not available"}), 503
        
        # Get user_id from query parameters
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id parameter is required"}), 400
        
        # Verify that authenticated user matches requested user_id
        if authenticated_uid != user_id:
            return jsonify({"error": "Unauthorized: You can only access your own reports"}), 403
        
        # Query Firestore for the specific report
        doc_ref = db.collection('users').document(user_id).collection('reports').document(report_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({"error": "Report not found"}), 404
        
        report_data = doc.to_dict()
        report_data['report_id'] = doc.id
        
        # Generate fresh signed URL for file access (if blob_path exists)
        if 'blob_path' in report_data and report_data['blob_path']:
            report_data['file_url'] = generate_signed_url(report_data['blob_path'])
        
        return jsonify({
            "success": True,
            "report": report_data
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve report: {str(e)}"}), 500


@app.errorhandler(413)
def file_too_large(e):
    """Handle file size limit exceeded"""
    return jsonify({"error": "File size exceeds 10MB limit"}), 413


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    # Run Flask app
    # Bind to 0.0.0.0:8000 for backend API (port 5000 reserved for frontend)
    port = int(os.environ.get('PORT', 8000))
    debug_mode = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 't')
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
