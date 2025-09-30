const PatientCard = ({ patient, onViewReports }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xl font-semibold text-blue-600">
              {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {patient.name || 'Unknown Patient'}
            </h3>
            <p className="text-sm text-gray-600">{patient.email}</p>
            <p className="text-xs text-gray-500 mt-1">
              {patient.reportCount || 0} reports
            </p>
          </div>
        </div>
        <button
          onClick={() => onViewReports(patient)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View Reports
        </button>
      </div>
    </div>
  );
};

export default PatientCard;
