import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const useUpload = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF and DOCX files are allowed';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: UploadFile[] = [];
    
    newFiles.forEach(file => {
      const error = validateFile(file);
      
      if (error) {
        toast.error(`${file.name}: ${error}`);
        return;
      }

      // Check for duplicates
      const isDuplicate = files.some(f => f.file.name === file.name && f.file.size === file.size);
      if (isDuplicate) {
        toast.error(`${file.name} is already added`);
        return;
      }

      validFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: 'pending'
      });
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file${validFiles.length > 1 ? 's' : ''} added`);
    }
  }, [files]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateFileStatus = useCallback((id: string, status: UploadFile['status'], progress?: number, error?: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id 
        ? { ...f, status, progress: progress ?? f.progress, error }
        : f
    ));
  }, []);

  const simulateUpload = (file: UploadFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      const duration = 2000 + Math.random() * 3000; // 2-5 seconds
      const shouldFail = Math.random() < 0.1; // 10% chance of failure
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          updateFileStatus(
            file.id,
            shouldFail ? 'error' : 'success',
            100,
            shouldFail ? 'Upload failed' : undefined
          );
          
          if (shouldFail) {
            reject(new Error('Upload failed'));
          } else {
            resolve();
          }
        } else {
          updateFileStatus(file.id, 'uploading', progress);
        }
      }, 100);
    });
  };

  const uploadFiles = useCallback(async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    
    try {
      await Promise.allSettled(
        pendingFiles.map(file => simulateUpload(file))
      );
      
      const successCount = files.filter(f => f.status === 'success').length;
      const errorCount = files.filter(f => f.status === 'error').length;
      
      if (errorCount === 0) {
        toast.success(`All ${successCount} files uploaded successfully!`);
      } else {
        toast.error(`${errorCount} file${errorCount > 1 ? 's' : ''} failed to upload`);
      }
    } catch (error) {
      toast.error('Upload process encountered errors');
    } finally {
      setIsUploading(false);
    }
  }, [files, updateFileStatus]);

  const retryFile = useCallback(async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;

    updateFileStatus(id, 'pending', 0);

    try {
      await simulateUpload(file);
    } catch (error) {
      // Error handling is done in simulateUpload
    }
  }, [files, updateFileStatus]);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const stats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    uploading: files.filter(f => f.status === 'uploading').length,
    success: files.filter(f => f.status === 'success').length,
    error: files.filter(f => f.status === 'error').length,
  };

  return {
    files,
    isUploading,
    stats,
    addFiles,
    removeFile,
    uploadFiles,
    retryFile,
    clearFiles,
    updateFileStatus,
  };
};