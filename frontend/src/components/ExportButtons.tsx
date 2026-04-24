import React from 'react';
import { Download, Printer } from 'lucide-react';
import { exportCSV, exportPDF } from '../utils/export';

interface Column {
  key: string;
  label: string;
}

interface Props {
  data: any[];
  columns: Column[];
  filename: string;
}

const ExportButtons: React.FC<Props> = ({ data, columns, filename }) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => exportCSV(data, columns, filename)}
        className="btn-secondary flex items-center space-x-1 px-3 py-1.5 text-sm"
        title="Export CSV"
      >
        <Download className="w-4 h-4" />
        <span>CSV</span>
      </button>
      <button
        onClick={exportPDF}
        className="btn-secondary flex items-center space-x-1 px-3 py-1.5 text-sm"
        title="Print / PDF"
      >
        <Printer className="w-4 h-4" />
        <span>Print</span>
      </button>
    </div>
  );
};

export default ExportButtons;
