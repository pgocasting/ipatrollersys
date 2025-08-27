import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Upload, 
  X, 
  Image, 
  Video, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { useCloudinaryUpload, ALLOWED_FILE_TYPES, FILE_SIZE_LIMITS } from '../utils/cloudinary';

export default function FileUpload({ 
  onUploadComplete, 
  onUploadError, 
  multiple = false, 
  accept = 'all',
  maxFiles = 5,
  folder = 'ipatroller',
  tags = [],
  className = ''
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  
  const fileInputRef = useRef(null);
  const { uploadFile, uploadMultipleFiles, isValidFile, getFileTypeCategory } = useCloudinaryUpload();

  // Handle file selection
  const handleFileSelect = async (files) => {
    const fileArray = Array.from(files);
    
    // Validate number of files
    if (multiple && fileArray.length > maxFiles) {
      setErrors([`Maximum ${maxFiles} files allowed`]);
      return;
    }

    // Validate files
    const validationErrors = [];
    const validFiles = [];

    fileArray.forEach(file => {
      if (!isValidFile(file)) {
        validationErrors.push(`${file.name}: Invalid file type or size`);
      } else {
        validFiles.push(file);
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setUploading(true);

    try {
      const uploadOptions = {
        folder,
        tags: [...tags, 'ipatroller-system'],
        uploadPreset: 'Files_Upload'
      };

      let result;
      if (multiple) {
        result = await uploadMultipleFiles(validFiles, uploadOptions);
      } else {
        result = await uploadFile(validFiles[0], uploadOptions);
      }

      if (result.success) {
        const newFiles = multiple ? result.successful : [result];
        setUploadedFiles(prev => [...prev, ...newFiles]);
        
        if (onUploadComplete) {
          onUploadComplete(result);
        }
      } else {
        const errorMessage = result.error || 'Upload failed';
        setErrors([errorMessage]);
        
        if (onUploadError) {
          onUploadError(errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = error.message || 'Upload failed';
      setErrors([errorMessage]);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Remove uploaded file
  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (ALLOWED_FILE_TYPES.images.includes(fileType)) return <Image className="h-5 w-5" />;
    if (ALLOWED_FILE_TYPES.videos.includes(fileType)) return <Video className="h-5 w-5" />;
    if (ALLOWED_FILE_TYPES.documents.includes(fileType)) return <FileText className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get accepted file types for input
  const getAcceptedTypes = () => {
    switch (accept) {
      case 'images':
        return ALLOWED_FILE_TYPES.images.join(',');
      case 'videos':
        return ALLOWED_FILE_TYPES.videos.join(',');
      case 'documents':
        return ALLOWED_FILE_TYPES.documents.join(',');
      default:
        return ALLOWED_FILE_TYPES.all.join(',');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}>
        <CardContent className="p-6">
          <div
            className="text-center"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {multiple ? 'Upload Files' : 'Upload File'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop files here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                browse files
              </button>
            </p>
            
            {/* File Type Info */}
            <div className="text-sm text-gray-500 mb-4">
              <p>Supported formats:</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  Images (JPEG, PNG, GIF, WebP)
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Videos (MP4, AVI, MOV, WMV, FLV)
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Documents (PDF, DOC, DOCX, TXT)
                </Badge>
              </div>
              <p className="mt-2">Max file size: {formatFileSize(FILE_SIZE_LIMITS.all)}</p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept={getAcceptedTypes()}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            {/* Upload Button */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-4"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : `Select ${multiple ? 'Files' : 'File'}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Uploaded Files ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.data?.format || 'unknown')}
                    <div>
                      <p className="font-medium text-sm">
                        {file.data?.publicId || `File ${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.data?.format?.toUpperCase()} • {formatFileSize(file.data?.size || 0)}
                        {file.data?.width && file.data?.height && ` • ${file.data.width}×${file.data.height}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.data?.url && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.data.url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.data.url;
                            link.download = file.data.publicId;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Uploading to Cloudinary...</p>
        </div>
      )}
    </div>
  );
}
