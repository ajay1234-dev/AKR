import { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { logout } from '../utils/firebase';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { getUserReports, getReportDetail } from '../utils/api';
import PatientCard from '../components/PatientCard';
import ReportList from '../components/ReportList';
import HealthChart from '../components/HealthChart';

const DoctorDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientReports, setPatientReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const patientsData = [];
      
      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        if (userData.role === 'patient') {
          const reportsSnapshot = await getDocs(
            collection(db, 'users', doc.id, 'reports')
          );
          
          patientsData.push({
            id: doc.id,
            ...userData,
            reportCount: reportsSnapshot.size
          });
        }
      }
      
      setPatients(patientsData);
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReports = async (patient) => {
    try {
      setSelectedPatient(patient);
      setSelectedReport(null);
      const response = await getUserReports(patient.id);
      setPatientReports(response.reports || []);
    } catch (err) {
      setError('Failed to load patient reports');
      console.error(err);
    }
  };

  const handleReportClick = async (report) => {
    try {
      const response = await getReportDetail(report.report_id, selectedPatient.id);
      setSelectedReport(response.report);
    } catch (err) {
      setError('Failed to load report details');
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const chartData = selectedPatient && patientReports.slice(0, 5).map((report, index) => ({
    date: new Date(report.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: patientReports.length - index
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">MediAnalyze</h1>
              <span className="ml-4 text-gray-600">Doctor Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{currentUser?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {selectedPatient ? `${selectedPatient.name}'s Reports` : 'My Patients'}
          </h2>
          
          {selectedPatient && (
            <button
              onClick={() => {
                setSelectedPatient(null);
                setPatientReports([]);
                setSelectedReport(null);
              }}
              className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center"
            >
              <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Patients
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : !selectedPatient ? (
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                  <p className="text-3xl font-bold text-blue-600">{patients.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Reports</p>
                  <p className="text-3xl font-bold text-green-600">
                    {patients.reduce((sum, p) => sum + (p.reportCount || 0), 0)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Active Today</p>
                  <p className="text-3xl font-bold text-purple-600">0</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onViewReports={handleViewReports}
                />
              ))}
            </div>

            {patients.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No patients found
              </div>
            )}
          </div>
        ) : (
          <div>
            {selectedReport && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Report Details: {selectedReport.filename}
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Extracted Text</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700">
                        {selectedReport.extracted_text || 'No text extracted'}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">AI Analysis</h4>
                    <div className="bg-blue-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {selectedReport.ai_analysis || 'No analysis available'}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedReport.file_url && (
                  <div className="mt-4">
                    <a
                      href={selectedReport.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Original File
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportList
                reports={patientReports}
                onReportClick={handleReportClick}
              />
              
              {chartData && (
                <HealthChart
                  data={chartData}
                  title="Patient Report Timeline"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
