import React from 'react';
import { jsPDF } from 'jspdf';

interface Props {
  data: any[];
}

export const PDFDownloadButton: React.FC<Props> = ({ data }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Grading Report', 20, 20);
    
    // Content
    doc.setFontSize(12);
    data.forEach((submission, index) => {
      const yPos = 40 + (index * 40);
      doc.text(`Student: ${submission.studentName}`, 20, yPos);
      doc.text(`Score: ${submission.totalScore?.toFixed(1)}%`, 20, yPos + 10);
      doc.text(`Status: ${submission.status}`, 20, yPos + 20);
    });
    
    doc.save('grading-report.pdf');
  };

  return (
    <button
      onClick={generatePDF}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
    >
      Export PDF
    </button>
  );
}; 