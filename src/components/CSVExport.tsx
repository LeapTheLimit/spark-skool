import React from 'react';

interface Props {
  data: any[];
}

export const CSVExport: React.FC<Props> = ({ data }) => {
  const generateCSV = () => {
    const headers = ['Student Name', 'Total Score', 'Status'];
    const rows = data.map(submission => [
      submission.studentName,
      submission.totalScore?.toFixed(1),
      submission.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grading-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={generateCSV}
      className="px-4 py-2 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
    >
      Export CSV
    </button>
  );
}; 