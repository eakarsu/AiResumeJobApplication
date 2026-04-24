import React from 'react';
import { Trash2, RefreshCw, XCircle } from 'lucide-react';

interface Props {
  selectedCount: number;
  onDelete: () => void;
  onStatusUpdate?: (status: string) => void;
  onClear: () => void;
  statusOptions?: string[];
}

const BulkActionBar: React.FC<Props> = ({
  selectedCount,
  onDelete,
  onStatusUpdate,
  onClear,
  statusOptions,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl px-6 py-3 flex items-center space-x-4 print:hidden">
      <span className="text-sm font-medium text-gray-700">
        {selectedCount} selected
      </span>

      <div className="h-6 w-px bg-gray-200" />

      <button
        onClick={onDelete}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete Selected</span>
      </button>

      {onStatusUpdate && statusOptions && statusOptions.length > 0 && (
        <select
          onChange={(e) => {
            if (e.target.value) {
              onStatusUpdate(e.target.value);
              e.target.value = '';
            }
          }}
          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium border-0 cursor-pointer"
          defaultValue=""
        >
          <option value="" disabled>Update Status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

      <button
        onClick={onClear}
        className="flex items-center space-x-1 px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm"
      >
        <XCircle className="w-4 h-4" />
        <span>Deselect</span>
      </button>
    </div>
  );
};

export default BulkActionBar;
