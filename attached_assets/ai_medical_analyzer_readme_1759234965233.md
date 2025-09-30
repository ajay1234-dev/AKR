# 🏥 AI-Driven Medical Report & Prescription Analyzer

## 📌 Overview
This project is a **full-stack AI-powered healthcare assistant** where patients and doctors can securely manage medical reports and prescriptions. The system automatically:

- Extracts & interprets key values from lab reports and prescriptions using **OCR + AI**.
- Highlights abnormal results & explains them in **simple, patient-friendly language**.
- Maintains a **timeline of patient health data** for longitudinal tracking.
- Provides **visualizations** for health progress and trend analysis.
- Sends **reminders** for medicines, follow-up tests, and checkups.
- Allows patients to share analyzed data with doctors online for consultation.
- Enables doctors to **review patient reports**, provide recommendations, and monitor health trends.

By combining AI with full-stack development, this platform empowers patients to better understand their health, improves doctor-patient communication, and sets the stage for future innovation like wearable integration, multilingual support, and personalized health recommendations.

---

## ⚡ Key Features

### Patient Features
- 🔐 **Secure Authentication** (Firebase Auth)
- 📤 **Upload Lab Reports & Prescriptions** (PDF, Image)
- 🤖 **AI-Powered Analysis** (Extracted text + summarized insights)
- 📊 **Health Timeline & Visualization** (Recharts / Chart.js)
- ⏰ **Medicine & Test Reminders** (Firebase Cloud Messaging)
- 🧑‍⚕️ **Connect with Doctors** (Share analyzed reports for consultation)
- 💬 **Chatbot for Symptom Queries** (Optional AI symptom checker)

### Doctor Features
- 🔐 **Secure Login & Dashboard**
- 📂 **View Patient Reports & Analysis**
- 📝 **Provide Feedback / Recommendations**
- 📊 **Monitor Patient Health Trends**
- 🔔 **Receive Notifications** when patients upload new reports

### Pages / Dashboards
- **Landing Page** → Overview of the platform
- **Patient Dashboard** → Upload files, view analysis, timeline, reminders
- **Doctor Dashboard** → View patients, analyze reports, give feedback
- **History Page** → Past medical reports and AI summaries
- **Profile Page** → Personal info, settings, and notifications

---

## 🏗️ Tech Stack

### Frontend
- **React / Next.js** → Patient & Doctor Dashboards
- **TailwindCSS / SCSS** → Styling
- **Recharts / Chart.js** → Health trend visualization
- **Vite** → Fast frontend bundling
- **Firebase Auth** → Secure login

### Backend
- **Python (Flask / FastAPI)** → AI + OCR API endpoints
- **Pytesseract / pdf2image / Pillow** → OCR for images and PDFs
- **LangChain + OpenAI/Gemini/Groq API** → Text summarization & analysis
- **Flask-CORS** → Allow frontend-backend communication

### Database
- **Firebase Firestore** → Patient & doctor data, health history
- **Firebase Storage** → Uploaded reports and images

---

## 📂 Project Structure

```
MedicalReportAnalyzer/
│
├─ backend/
│   ├─ app.py               # Flask backend server
│   ├─ ocr_utils.py         # OCR helper functions
│   ├─ ai_analysis.py       # AI text summarization logic
│   └─ requirements.txt
│
├─ frontend/
│   ├─ package.json
│   ├─ vite.config.js
│   ├─ public/
│   └─ src/
│       ├─ App.jsx
│       ├─ index.jsx
│       ├─ components/
│       │   ├─ UploadReport.jsx
│       │   ├─ PatientDashboard.jsx
│       │   ├─ DoctorDashboard.jsx
│       │   ├─ HistoryPage.jsx
│       │   ├─ ProfilePage.jsx
│       │   └─ Notifications.jsx
│       └─ utils/
│           └─ api.js       # Axios/fetch wrappers
│
├─ README.md
└─ .replit
```

---

## 🚀 Getting Started (Replit)

### 1️⃣ Run Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 2️⃣ Run Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3️⃣ Run Both Servers in Replit
- Use `.replit` file:
```
run = "python backend/app.py & npm --prefix frontend run dev"
```
- Open the frontend URL → Upload files → Test AI analysis

---

## 🛠️ Future Enhancements
- Integrate **full AI analysis** using patient symptoms + reports
- Add **multilingual support** for reports & prescriptions
- Integrate **wearable health device data**
- Enable **video/teleconsultation with doctors**
- Implement **push notifications** for urgent abnormal results
