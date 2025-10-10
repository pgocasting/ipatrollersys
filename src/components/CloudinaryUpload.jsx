import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Upload, 
  Image, 
  Video, 
  File, 
  X, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Eye,
  Download,
  Trash2,
  Plus,
  Camera,
  Film,
  FileText
} from 'lucide-react';
import { clientUploadUtils } from '../utils/cloudinary';

export default function CloudinaryUpload({ 
  onUploadComplete, 
  onUploadError, 
  allowedTypes = ['image', 'video', 'file'],
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  folder = 'ipatroller/uploads',
  className = ''
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // File type validation
  const isValidFileType = (file) => {
    const fileType = file.type.split('/')[0];
    return allowedTypes.includes(fileType) || allowedTypes.includes('file');
  };

  // File size validation
  const isValidFileSize = (file) => {
    return file.size <= maxFileSize;
  };

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles) => {
    const validFiles = Array.from(selectedFiles).filter(file => {
      if (!isValidFileType(file)) {
        console.warn(`⚠️ File type not allowed: ${file.name}`);
        return false;
      }
      if (!isValidFileSize(file)) {
        console.warn(`⚠️ File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length + files.length > maxFiles) {
      console.warn(`⚠️ Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles = validFiles.map(file => ({
      id: `${Date.now()}_${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [files, maxFiles, allowedTypes]);

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Upload files to Cloudinary
  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress({});

    try {
      const uploadPromises = files.map(async (fileObj) => {
        try {
          setUploadProgress(prev => ({
            ...prev,
            [fileObj.id]: { status: 'uploading', progress: 0 }
          }));

          const result = await clientUploadUtils.uploadToCloudinary(fileObj.file, {
            folder,
            publicId: `${folder}/${fileObj.name.replace(/\.[^/.]+$/, '')}_${Date.now()}`
          });

          if (result.success) {
            setUploadProgress(prev => ({
              ...prev,
              [fileObj.id]: { status: 'completed', progress: 100 }
            }));

            const uploadedFile = {
              ...fileObj,
              ...result.data,
              status: 'uploaded'
            };

            setUploadedFiles(prev => [...prev, uploadedFile]);
            return { success: true, data: uploadedFile };
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          setUploadProgress(prev => ({
            ...prev,
            [fileObj.id]: { status: 'failed', progress: 0, error: error.message }
          }));
          return { success: false, error: error.message, file: fileObj };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      // Clear files after upload
      setFiles([]);

      // Call callbacks
      if (successful.length > 0 && onUploadComplete) {
        onUploadComplete(successful.map(r => r.data));
      }

      if (failed.length > 0 && onUploadError) {
        onUploadError(failed);
      }

      console.log(`✅ Upload completed: ${successful.length} successful, ${failed.length} failed`);

    } catch (error) {
      console.error('❌ Upload failed:', error);
      if (onUploadError) {
        onUploadError([{ error: error.message }]);
      }
    } finally {
      setUploading(false);
    }
  };

  // Remove file from list
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Remove uploaded file
  const removeUploadedFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Get file icon based on type
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />;
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-2">
              <div className="flex justify-center space-x-2 text-gray-500">
                <Camera className="h-8 w-8" />
                <Film className="h-8 w-8" />
                <FileText className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium text-gray-700">
                Drag & drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports images, videos, and documents up to {formatFileSize(maxFileSize)}
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.map(type => {
              switch (type) {
                case 'image': return 'image/*';
                case 'video': return 'video/*';
                case 'file': return '*/*';
                default: return '*/*';
              }
            }).join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Selected Files ({files.length})</h4>
                <Button
                  onClick={uploadFiles}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload Files'}
                </Button>
              </div>

              <div className="space-y-2">
                {files.map((fileObj) => (
                  <div
                    key={fileObj.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {fileObj.preview ? (
                        <img
                          src={fileObj.preview}
                          alt={fileObj.name}
                          className="h-10 w-10 object-cover rounded"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                          {getFileIcon(fileObj.type)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{fileObj.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileObj.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {uploadProgress[fileObj.id] && (
                        <div className="text-xs">
                          {uploadProgress[fileObj.id].status === 'uploading' && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                          {uploadProgress[fileObj.id].status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {uploadProgress[fileObj.id].status === 'failed' && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileObj.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((fileObj) => (
                <div
                  key={fileObj.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* File Preview */}
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {fileObj.format && fileObj.format.startsWith('image') ? (
                      <img
                        src={fileObj.url}
                        alt={fileObj.name}
                        className="w-full h-full object-cover"
                      />
                    ) : fileObj.format && fileObj.format.startsWith('video') ? (
                      <video
                        src={fileObj.url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="space-y-2">
                    <p className="font-medium text-sm truncate" title={fileObj.name}>
                      {fileObj.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Badge variant="outline" className="text-xs">
                        {fileObj.format?.toUpperCase() || 'FILE'}
                      </Badge>
                      <span>{formatFileSize(fileObj.size)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(fileObj.url, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(fileObj.url, '_blank')}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeUploadedFile(fileObj.id)}
                      className="h-8 w-8 p-0"
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
    </div>
  );
}
