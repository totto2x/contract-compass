import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, RotateCcw, Eye, Plus, Loader2 } from 'lucide-react';

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
  isProcessingComplete?: boolean; // New prop to indicate if processing is complete
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
  isProcessingComplete = false, // Default to false
}) => {
  const hasFiles = stats.total > 0;
  const hasErrors = stats.error > 0;
  const allComplete = stats.success === stats.total && stats.total > 0;
  const canUpload = (stats.pending > 0 || stats.error > 0) && !isUploading;

  if (!hasFiles) return null;

  // Generate status message
  const getStatusMessage = () => {
    if (allComplete && isProcessingComplete) {
      return {
        icon: <CheckCircle className="w-6 h-6 text-green-600" />,
        text: `Processing Complete`,
        subtext: `👉 The magic is done! Click View Project to review your final contract and changelog.`,
        className: 'text-green-700',
        isSuccess: true
      };
    } else if (allComplete) {
      return {
        icon: <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />,
        text: `Processing Documents`,
        subtext: `Your ${stats.total} document${stats.total !== 1 ? 's are' : ' is'} added to ${projectName || 'the project'}. We are extracting key terms, linking amendments, and preparing a final version with a changelog.`,
        className: 'text-blue-700',
        isProcessing: true
      };
    } else if (hasErrors && stats.success > 0) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        text: `${stats.success} of ${stats.total} file${stats.total !== 1 ? 's' : ''} uploaded successfully`,
        subtext: `Some files encountered errors during upload. You can retry the failed uploads or continue with the successfully uploaded files.`,
        className: 'text-yellow-700',
        isSuccess: false
      };
    } else if (hasErrors && stats.success === 0) {
      return {
        icon: <XCircle className="w-5 h-5 text-red-600" />,
        text: `Upload failed for ${stats.error} file${stats.error !== 1 ? 's' : ''}`,
        subtext: `All files failed to upload. Please check your files and try again.`,
        className: 'text-red-700',
        isSuccess: false
      };
    } else if (isUploading) {
      return {
        icon: <RotateCcw className="w-5 h-5 text-blue-600 animate-spin" />,
        text: `Uploading ${stats.uploading} file${stats.uploading !== 1 ? 's' : ''}...`,
        subtext: `Please wait while your files are being uploaded and processed.`,
        className: 'text-blue-700',
        isSuccess: false
      };
    } else {
      return {
        icon: <CheckCircle className="w-5 h-5 text-gray-600" />,
        text: `Start Analysis of ${stats.pending} file${stats.pending !== 1 ? 's' : ''}`,
        subtext: `Click the process documents below to start analysis.`,
        className: 'text-gray-700',
        isSuccess: false
      };
    }
  };

  const statusMessage = getStatusMessage();

  // Determine the heading based on processing state
  const getHeading = () => {
    if (isProcessingComplete) {
      return "Analyzed Documents";
    }
    return "Analyze Documents";
  };

  // Determine if View Project button should be disabled
  const isViewProjectDisabled = allComplete && !isProcessingComplete;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{getHeading()}</h3>

      {/* Enhanced Status Message - More Prominent for Success and Processing */}
      <div className="mb-6">
        {statusMessage.isSuccess ? (
          // Prominent success styling
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                {statusMessage.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-green-800 mb-2">
                  {statusMessage.text}
                </h4>
                <p className="text-base text-green-700 leading-relaxed font-medium">
                  {statusMessage.subtext}
                </p>
              </div>
            </div>
          </div>
        ) : statusMessage.isProcessing ? (
          // Prominent processing styling
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                {statusMessage.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-blue-800 mb-2">
                  {statusMessage.text}
                </h4>
                <p className="text-base text-blue-700 leading-relaxed font-medium">
                  {statusMessage.subtext}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Regular styling for other states
          <div className={`flex items-center space-x-2 mb-2`}>
            {statusMessage.icon}
            <p className={`text-lg font-medium ${statusMessage.className}`}>
              {statusMessage.text}
            </p>
          </div>
        )}
        
        {/* Show subtext for non-success and non-processing states */}
        {!statusMessage.isSuccess && !statusMessage.isProcessing && (
          <p className="text-sm text-gray-600 leading-relaxed">
            {statusMessage.subtext}
          </p>
        )}
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
            {/* Primary Action - View Project (Disabled during processing) */}
            <button
              onClick={onViewProject || onGoToDashboard}
              disabled={isViewProjectDisabled}
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                isViewProjectDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title={isViewProjectDisabled ? 'Please wait while documents are being processed' : 'View project details'}
            >
              <Eye className="w-4 h-4" />
              <span>View Project</span>
            </button>
            
            {/* Upload More Documents Button - HIDDEN */}
            {/* Removed the Upload More Documents button as requested */}
          </>
        )}
      </div>
    </div>
  );
};

export default UploadSummary;