import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { TextExtractionService } from '../../lib/textExtraction';

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onFilesAdded, disabled = false }) => {
  const [workerStatus, setWorkerStatus] = useState<'checking' | 'ready' | 'error'>('checking');

  useEffect(() => {
    // Test PDF.js worker configuration on component mount
    const testWorker = async () => {
      try {
        const isWorking = await TextExtractionService.testWorkerConfiguration();
        setWorkerStatus(isWorking ? 'ready' : 'error');
      } catch (error) {
        console.error('Worker test failed:', error);
        setWorkerStatus('error');
      }
    };

    testWorker();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Filter for supported file types
    const supportedFiles = acceptedFiles.filter(file => 
      TextExtractionService.isSupportedFileType(file)
    );

    const unsupportedFiles = acceptedFiles.filter(file => 
      !TextExtractionService.isSupportedFileType(file)
    );

    // Show warnings for unsupported files
    if (unsupportedFiles.length > 0) {
      console.warn('Unsupported files:', unsupportedFiles.map(f => f.name));
    }

    // Show warnings for rejected files
    if (rejectedFiles.length > 0) {
      console.warn('Rejected files:', rejectedFiles.map(f => f.file?.name || 'Unknown'));
    }

    if (supportedFiles.length > 0) {
      onFilesAdded(supportedFiles);
    }
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    disabled: disabled || workerStatus === 'error',
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const getWorkerStatusIndicator = () => {
    switch (workerStatus) {
      case 'checking':
        return (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Initializing text extraction...</span>
          </div>
        );
      case 'ready':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-3 h-3" />
            <span className="text-xs">Text extraction ready</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs">Text extraction unavailable</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Worker Status */}
      <div className="flex justify-center">
        {getWorkerStatusIndicator()}
      </div>

      <div
        {...getRootProps()}
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer',
          {
            'border-blue-300 bg-blue-50': isDragActive && !isDragReject,
            'border-red-300 bg-red-50': isDragReject,
            'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100': !isDragActive && !disabled && workerStatus === 'ready',
            'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50': disabled || workerStatus === 'error',
          }
        )}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className={clsx(
            'w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors',
            {
              'bg-blue-100': isDragActive && !isDragReject,
              'bg-red-100': isDragReject,
              'bg-gray-200': !isDragActive && !disabled && workerStatus === 'ready',
              'bg-gray-300': disabled || workerStatus === 'error',
            }
          )}>
            {isDragReject ? (
              <AlertCircle className="w-8 h-8 text-red-600" />
            ) : (
              <Upload className={clsx(
                'w-8 h-8 transition-colors',
                {
                  'text-blue-600': isDragActive && !isDragReject,
                  'text-gray-600': !isDragActive && !disabled && workerStatus === 'ready',
                  'text-gray-500': disabled || workerStatus === 'error',
                }
              )} />
            )}
          </div>

          <div>
            {workerStatus === 'error' ? (
              <div className="text-red-600">
                <p className="text-lg font-semibold">Text extraction unavailable</p>
                <p className="text-sm">PDF processing is currently disabled. Please try refreshing the page.</p>
              </div>
            ) : isDragReject ? (
              <div className="text-red-600">
                <p className="text-lg font-semibold">Invalid file type</p>
                <p className="text-sm">Only PDF and DOCX files are supported</p>
              </div>
            ) : isDragActive ? (
              <div className="text-blue-600">
                <p className="text-lg font-semibold">Drop files here</p>
                <p className="text-sm">Release to add your documents</p>
              </div>
            ) : (
              <div className="text-gray-600">
                <p className="text-lg font-semibold">
                  {disabled ? 'Upload in progress...' : 'Drag and drop your contracts'}
                </p>
                <p className="text-sm">
                  {disabled 
                    ? 'Please wait while files are being processed'
                    : 'or click to browse files'
                  }
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>PDF, DOCX</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span>Max 10MB per file</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span>Text extraction enabled</span>
          </div>

          {/* File Type Support Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Supported Document Types</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <p>• <strong>PDF files:</strong> Searchable PDFs with extractable text</p>
              <p>• <strong>DOCX files:</strong> Microsoft Word documents (.docx format)</p>
              <p>• <strong>Text extraction:</strong> Automatic content analysis for AI processing</p>
            </div>
          </div>

          {/* Worker Error Info */}
          {workerStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
              <h4 className="text-sm font-medium text-red-900 mb-2">Text Extraction Issue</h4>
              <div className="text-xs text-red-800 space-y-1">
                <p>• PDF.js worker failed to initialize</p>
                <p>• Text extraction from PDFs is currently unavailable</p>
                <p>• Try refreshing the page or contact support</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileDropzone;