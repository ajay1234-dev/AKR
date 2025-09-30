"""
Utility functions for OCR text extraction and AI analysis
Handles PDF to image conversion, image text extraction, and Gemini AI integration
"""

import os
import tempfile
from typing import Tuple, Optional
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
from google import genai
from google.genai import types

# Initialize Gemini client
# IMPORTANT: Using python_gemini integration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required but not set")
client = genai.Client(api_key=GEMINI_API_KEY)


def extract_text_from_image(image_path: str) -> str:
    """
    Extract text from an image file using Tesseract OCR.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Extracted text as a string
        
    Raises:
        Exception: If OCR extraction fails
    """
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from image: {str(e)}")


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Convert PDF to images and extract text from each page using OCR.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Combined extracted text from all pages
        
    Raises:
        Exception: If PDF conversion or text extraction fails
    """
    try:
        # Convert PDF to list of images (one per page)
        images = convert_from_path(pdf_path)
        
        all_text = []
        for i, image in enumerate(images):
            # Extract text from each page
            page_text = pytesseract.image_to_string(image)
            if page_text.strip():
                all_text.append(f"--- Page {i+1} ---\n{page_text.strip()}")
        
        return "\n\n".join(all_text)
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")


def analyze_medical_text_with_ai(extracted_text: str) -> str:
    """
    Analyze medical report text using Gemini AI and generate patient-friendly explanation.
    
    Args:
        extracted_text: The text extracted from medical report/prescription
        
    Returns:
        AI-generated analysis in patient-friendly language
        
    Raises:
        Exception: If AI analysis fails
    """
    try:
        if not extracted_text or len(extracted_text.strip()) < 10:
            return "Unable to analyze: insufficient text extracted from the document."
        
        # Limit input size to prevent token limit issues (roughly 15,000 characters ~ 4,000 tokens)
        MAX_CHARS = 15000
        if len(extracted_text) > MAX_CHARS:
            extracted_text = extracted_text[:MAX_CHARS] + "\n...[Text truncated due to length]"
        
        # System instruction with safety disclaimer
        system_instruction = """You are a medical AI assistant helping patients understand their medical reports and prescriptions.

IMPORTANT DISCLAIMER: You must always include this in your response:
"⚠️ This is an AI-generated analysis for informational purposes only. It is NOT medical advice. Always consult with your healthcare provider for proper interpretation and clinical decisions."

Your role is to help patients understand their medical documents, not to diagnose or prescribe treatment."""

        # Create detailed prompt for medical analysis
        user_prompt = f"""Analyze the following medical text and provide a clear, patient-friendly explanation that includes:

1. **Document Type**: Identify if this is a lab report, prescription, radiology report, etc.
2. **Key Findings**: List the main test results, medications, or findings
3. **Normal vs Abnormal**: Highlight any values that are outside normal ranges (if applicable)
4. **Simple Explanation**: Explain what these results mean in simple, non-technical language
5. **Recommendations**: Suggest next steps (e.g., "discuss with your doctor", "this appears normal")

Medical Text:
{extracted_text}

Remember to include the important disclaimer at the end of your analysis."""

        # Call Gemini AI with supported model and configuration
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
                max_output_tokens=2048
            )
        )
        
        if response.text:
            return response.text
        else:
            return "AI analysis could not be generated. Please try again or consult your healthcare provider."
            
    except Exception as e:
        error_msg = str(e).lower()
        # Handle common error cases with user-friendly messages
        if "quota" in error_msg or "rate" in error_msg:
            return "Service temporarily unavailable due to high demand. Please try again in a few moments."
        elif "invalid" in error_msg and "api" in error_msg:
            return "API configuration error. Please contact support."
        elif "token" in error_msg or "length" in error_msg:
            return "Document is too large to analyze. Please try a shorter document or split it into sections."
        else:
            raise Exception(f"Failed to analyze medical text with AI: {str(e)}")


def process_uploaded_file(file_path: str, file_extension: str) -> Tuple[str, str]:
    """
    Process uploaded file (PDF or image) and return extracted text + AI analysis.
    
    Args:
        file_path: Path to the uploaded file
        file_extension: File extension (pdf, png, jpg, jpeg, gif)
        
    Returns:
        Tuple of (extracted_text, ai_analysis)
        
    Raises:
        Exception: If processing fails
    """
    try:
        # Extract text based on file type
        if file_extension.lower() == 'pdf':
            extracted_text = extract_text_from_pdf(file_path)
        elif file_extension.lower() in ['png', 'jpg', 'jpeg', 'gif']:
            extracted_text = extract_text_from_image(file_path)
        else:
            raise Exception(f"Unsupported file type: {file_extension}")
        
        # If no text was extracted, return error
        if not extracted_text or len(extracted_text.strip()) < 5:
            return "", "No readable text found in the document. Please ensure the image is clear and contains text."
        
        # Get AI analysis of the extracted text
        ai_analysis = analyze_medical_text_with_ai(extracted_text)
        
        return extracted_text, ai_analysis
        
    except Exception as e:
        raise Exception(f"Failed to process file: {str(e)}")
