import React, { useState, useRef, useCallback } from 'react';
import { apiRequest } from '../lib/api';

interface MediaUploadWidgetProps {
  onUpload: (uploadedFiles: UploadedFile[]) => void;
  onError: (error: string) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  existingFiles?: UploadedFile[];
  className?: string;
}

export interface UploadedFile {
  id?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  is_primary?: boolean;
}

export default function MediaUploadWidget({
  onUpload,
  onError,
  maxFiles = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 5, // 5MB
  existingFiles = [],
  className = ''
}: MediaUploadWidgetProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(existingFiles);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} not supported. Please upload ${acceptedTypes.join(', ')} files.`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit.`;
    }
    
    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const fileId = Math.random().toString(36).substr(2, 9);
    
    try {
      // Update progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      // Get pre-signed URL for S3 upload
      const uploadData = await apiRequest('/api/listings/upload-url/', {
        method: 'POST',
        body: JSON.stringify({
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        }),
      });

      setUploadProgress(prev => ({ ...prev, [fileId]: 25 }));

      // Upload file to S3 using the pre-signed URL
      const uploadResponse = await fetch(uploadData.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      setUploadProgress(prev => ({ ...prev, [fileId]: 75 }));

      // Confirm upload completion with backend
      const confirmResponse = await apiRequest('/api/listings/upload-confirm/', {
        method: 'POST',
        body: JSON.stringify({
          file_key: uploadData.file_key,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        }),
      });

      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

      // Clean up progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }, 1000);

      return {
        id: confirmResponse.id,
        file_name: file.name,
        file_url: confirmResponse.file_url,
        file_type: file.type,
        file_size: file.size,
        is_primary: uploadedFiles.length === 0, // First image is primary
      };
    } catch (error) {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
      throw error;
    }
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      onError(`Cannot upload more than ${maxFiles} files`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      onError(errors.join('\n'));
      return;
    }

    if (validFiles.length === 0) {
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = validFiles.map(file => uploadFile(file));
      const uploadResults = await Promise.all(uploadPromises);
      
      const newUploadedFiles = [...uploadedFiles, ...uploadResults];
      setUploadedFiles(newUploadedFiles);
      onUpload(newUploadedFiles);
    } catch (error: any) {
      console.error('Upload error:', error);
      onError(error.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  }, [uploadedFiles, maxFiles, onUpload, onError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleRemoveFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    
    // If we removed the primary image, make the first remaining image primary
    if (uploadedFiles[index].is_primary && newFiles.length > 0) {
      newFiles[0].is_primary = true;
    }
    
    setUploadedFiles(newFiles);
    onUpload(newFiles);
  };

  const handleSetPrimary = (index: number) => {
    const newFiles = uploadedFiles.map((file, i) => ({
      ...file,
      is_primary: i === index
    }));
    
    setUploadedFiles(newFiles);
    onUpload(newFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`media-upload-widget ${className}`}>
      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        <div className="upload-content">
          {uploading ? (
            <div className="upload-status">
              <div className="upload-spinner" />
              <p>Uploading files...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <h3>Drop files here or click to upload</h3>
              <p>
                Upload up to {maxFiles} images ({acceptedTypes.join(', ')})<br/>
                Max file size: {maxFileSize}MB per file
              </p>
            </>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="upload-progress-container">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="upload-progress-item">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4>Uploaded Images ({uploadedFiles.length}/{maxFiles})</h4>
          <div className="files-grid">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-preview">
                  <img 
                    src={file.file_url} 
                    alt={file.file_name}
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA2NUw0NSA1NSw1NSA2NUw3NSA0NUwzNSA2NVoiIGZpbGw9IiNEMUQ1REIiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSIzNSIgcj0iNSIgZmlsbD0iI0QxRDVEQiIvPgo8L3N2Zz4=';
                    }}
                  />
                  {file.is_primary && (
                    <div className="primary-badge">Primary</div>
                  )}
                </div>
                
                <div className="file-info">
                  <div className="file-name" title={file.file_name}>
                    {file.file_name}
                  </div>
                  <div className="file-size">
                    {formatFileSize(file.file_size)}
                  </div>
                </div>
                
                <div className="file-actions">
                  {!file.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      className="action-btn primary-btn"
                      title="Set as primary image"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="action-btn remove-btn"
                    title="Remove image"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .media-upload-widget {
          width: 100%;
        }

        .upload-zone {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #f9fafb;
        }

        .upload-zone:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .upload-zone.drag-active {
          border-color: #3b82f6;
          background: #eff6ff;
          transform: scale(1.02);
        }

        .upload-zone.uploading {
          border-color: #10b981;
          background: #f0fdf4;
          cursor: not-allowed;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .upload-icon {
          color: #6b7280;
          opacity: 0.8;
        }

        .upload-zone.drag-active .upload-icon,
        .upload-zone:hover .upload-icon {
          color: #3b82f6;
        }

        .upload-content h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .upload-content p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }

        .upload-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .upload-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .upload-progress-container {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .upload-progress-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 12px;
          color: #6b7280;
          min-width: 40px;
          text-align: right;
        }

        .uploaded-files {
          margin-top: 24px;
        }

        .uploaded-files h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .file-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .file-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .file-preview {
          position: relative;
          width: 100%;
          height: 120px;
          overflow: hidden;
        }

        .file-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .primary-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .file-info {
          padding: 12px;
        }

        .file-name {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 12px;
          color: #6b7280;
        }

        .file-actions {
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-btn {
          background: #f3f4f6;
          color: #6b7280;
        }

        .primary-btn:hover {
          background: #fef3c7;
          color: #f59e0b;
        }

        .remove-btn {
          background: #f3f4f6;
          color: #6b7280;
        }

        .remove-btn:hover {
          background: #fef2f2;
          color: #ef4444;
        }

        @media (max-width: 640px) {
          .upload-zone {
            padding: 24px 16px;
          }

          .files-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 