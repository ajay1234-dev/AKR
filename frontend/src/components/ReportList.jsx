import { useState } from 'react';

const ReportList = ({ reports, onReportClick, showPatientInfo = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = reports.filter(report =>
    report.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.ai_analysis && report.ai_analysis.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">
          Medical Reports ({filteredReports.length})
        </h3>
        <input
          type="text"
          placeholder="Search reports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No reports found
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.report_id}
              onClick={() => onReportClick(report)}
              className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {report.filename}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {formatDate(report.uploaded_at)}
                  </p>
                  {report.ai_analysis && (
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {report.ai_analysis.substring(0, 150)}...
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportList;
