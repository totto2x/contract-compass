import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, RotateCcw, Eye, Plus } from 'lucide-react';

interface UploadSummaryProps {
  stats: {
    total: number;
    pending: number;
    uploading: number;
    success: number;
    error: number;
  };
  isUploading: boolean;
  onUpload: () => void;
  onRetryAll: () => void;
  onGoToDashboard: () => void;
  onProcessFiles: () => void;
  onViewProject?: () => void;
  onUploadMore?: () => void;
  projectName?: string;
}

const UploadSummary: React.FC<UploadSummaryProps> = ({
  stats,
  isUploading,
  onUpload,
  onRetryAll,
  onGoToDashboard,
  onProcessFiles,
  onViewProject,
  onUploadMore,
  projectName,
}) => {
  const hasFiles = stats.total > 0;
  const hasErrors = stats.error > 0;
  const allComplete = stats.success === stats.total && stats.total > 0;
  const canUpload = (stats.pending > 0 || stats.error > 0) && !isUploading;

  const handleUploadMore = () => {
    if (onUploadMore) {
      onUploadMore();
    }
  };

  if (!hasFiles) return null;

  // Generate status message
  const getStatusMessage = () => {
    if (allComplete) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        text: `Files uploaded successfully`,
        subtext: `All ${stats.total} file${stats.total !== 1 ? 's' : ''} have been added to ${projectName || 'the project'}. You can now review contract data and track changes.`,
        className: 'text-green-700'
      };
    } else if (hasErrors && stats.success > 0) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        text: `${stats.success} of ${stats.total} file${stats.total !== 1 ? 's' : ''} uploaded successfully`,
        subtext: `Some files encountered errors during upload. You can retry the failed uploads or continue with the successfully uploaded files.`,
        className: 'text-yellow-700'
      };
    } else if (hasErrors && stats.success === 0) {
      return {
        icon: <XCircle className="w-5 h-5 text-red-600" />,
        text: `Upload failed for ${stats.error} file${stats.error !== 1 ? 's' : ''}`,
        subtext: `All files failed to upload. Please check your files and try again.`,
        className: 'text-red-700'
      };
    } else if (isUploading) {
      return {
        icon: <RotateCcw className="w-5 h-5 text-blue-600 animate-spin" />,
        text: `Uploading ${stats.uploading} file${stats.uploading !== 1 ? 's' : ''}...`,
        subtext: `Please wait while your files are being uploaded and processed.`,
        className: 'text-blue-700'
      };
    } else {
      return {
        icon: <CheckCircle className="w-5 h-5 text-gray-600" />,
        text: `Start Analysis of ${stats.pending} file${stats.pending !== 1 ? 's' : ''}`,
        subtext: `Click the process documents below to start analysis.`,
        className: 'text-gray-700'
      };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Analyze Documents</h3>

      {/* Status Message */}
      <div className="mb-6">
        <div className={`flex items-center space-x-2 mb-2`}>
          {statusMessage.icon}
          <p className={`text-lg font-medium ${statusMessage.className}`}>
            {statusMessage.text}
          </p>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {statusMessage.subtext}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {canUpload && (
          <button
            onClick={onUpload}
            disabled={isUploading}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <span>Process Documents</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {hasErrors && !isUploading && (
          <button
            onClick={onRetryAll}
            className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Failed</span>
          </button>
        )}

        {allComplete && (
          <>
            {/* Primary Action - View Project */}
            <button
              onClick={onViewProject || onGoToDashboard}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Eye className="w-4 h-4" />
              <span>View Project</span>
            </button>
            
            {/* Secondary Action - Upload More Documents */}
            {onUploadMore && (
              <button
                onClick={handleUploadMore}
                className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Upload More Documents</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UploadSummary;