import { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { getUserReports, getReportDetail } from '../utils/api';
import { logout } from '../utils/firebase';
import { useNavigate } from 'react-router-dom';
import UploadReport from '../components/UploadReport';
import ReportList from '../components/ReportList';
import HealthChart from '../components/HealthChart';

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReports();
  }, [currentUser]);

  const loadReports = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const response = await getUserReports(currentUser.uid);
      setReports(response.reports || []);
    } catch (err) {
      setError('Failed to load reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (result) => {
    loadReports();
    setSelectedReport({
      filename: result.filename,
      extracted_text: result.extracted_text,
      ai_analysis: result.ai_analysis,
      report_id: result.report_id
    });
  };

  const handleReportClick = async (report) => {
    try {
      const response = await getReportDetail(report.report_id, currentUser.uid);
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

  const chartData = reports.slice(0, 5).map((report, index) => ({
    date: new Date(report.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: reports.length - index
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">MediAnalyze</h1>
              <span className="ml-4 text-gray-600">Patient Dashboard</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <UploadReport onUploadSuccess={handleUploadSuccess} />
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Reports</p>
                <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Recent Uploads</p>
                <p className="text-3xl font-bold text-green-600">
                  {reports.filter(r => {
                    const date = new Date(r.uploaded_at);
                    const now = new Date();
                    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
                    return diffDays <= 7;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {selectedReport && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Analysis Results: {selectedReport.filename}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Extracted Text</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {selectedReport.extracted_text || 'No text extracted'}
                  </pre>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">AI Analysis</h3>
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
            reports={reports}
            onReportClick={handleReportClick}
          />
          
          <HealthChart
            data={chartData}
            title="Upload Timeline"
          />
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
