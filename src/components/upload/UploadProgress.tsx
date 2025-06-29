import React from 'react';
import { FileText, CheckCircle, XCircle, RotateCcw, X } from 'lucide-react';
import clsx from 'clsx';
import { UploadFile } from '../../hooks/useUpload';

interface UploadProgressProps {
  files: UploadFile[];
  onRemoveFile: (id: string) => void;
  onRetryFile: (id: string) => void;
  disabled?: boolean;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ 
  files, 
  onRemoveFile, 
  onRetryFile, 
  disabled = false 
}) => {
  if (files.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'uploading':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div style={{ display: 'none' }}>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upload Progress ({files.length} file{files.length !== 1 ? 's' : ''})
        </h3>
        
        <div className="space-y-4">
          {files.map((file) => (
            <div key={file.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file.size)}
                    </p>
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {file.status === 'error' && (
                    <button
                      onClick={() => onRetryFile(file.id)}
                      disabled={disabled}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                      title="Retry upload"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  
                  {(file.status === 'pending' || file.status === 'error') && (
                    <button
                      onClick={() => onRemoveFile(file.id)}
                      disabled={disabled}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  
                  {file.status === 'success' && (
                    <span className="text-xs font-medium text-green-600">Complete</span>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={clsx(
                    'h-2 rounded-full transition-all duration-300 ease-out',
                    getStatusColor(file.status)
                  )}
                  style={{ width: `${file.progress}%` }}
                />
              </div>
              
              {/* Progress Text */}
              <div className="flex justify-between items-center mt-2">
                <span className={clsx(
                  'text-xs font-medium capitalize',
                  {
                    'text-green-600': file.status === 'success',
                    'text-red-600': file.status === 'error',
                    'text-blue-600': file.status === 'uploading',
                    'text-gray-600': file.status === 'pending',
                  }
                )}>
                  {file.status === 'uploading' ? 'Uploading...' : file.status}
                </span>
                <span className="text-xs text-gray-500">
                  {Math.round(file.progress)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;