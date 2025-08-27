import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Camera, 
  Upload, 
  X, 
  Image, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { useCloudinaryUpload, ALLOWED_FILE_TYPES } from '../utils/cloudinary';

export default function PhotoUpload({ 
  type = 'before', // 'before' or 'after'
  onPhotoUpload, 
  onPhotoRemove,
  existingPhoto = null,
  className = ''
}) {
  const [uploading, setUploading] = useState(false);
  const [photo, setPhoto] = useState(existingPhoto);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(existingPhoto?.url || null);
  
  const fileInputRef = useRef(null);
  const { uploadFile, isValidFile } = useCloudinaryUpload();

  // Handle file selection
  const handleFileSelect = async (files) => {
    const file = files[0];
    
    if (!file) return;

    // Validate file
    if (!isValidFile(file)) {
      setError('Invalid file type or size. Please select a valid image file.');
      return;
    }

    // Validate image type
    if (!ALLOWED_FILE_TYPES.images.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP).');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      const result = await uploadFile(file, {
        folder: 'ipatroller/photos',
        tags: ['ipatroller-system', type, 'photo'],
        uploadPreset: 'Files_Upload'
      });

      if (result.success) {
        const photoData = {
          ...result.data,
          type,
          uploadedAt: new Date().toISOString(),
          originalName: file.name
        };

        setPhoto(photoData);
        
        if (onPhotoUpload) {
          onPhotoUpload(photoData);
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      setError(error.message || 'Upload failed');
      setPreview(null);
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

  // Remove photo
  const removePhoto = () => {
    setPhoto(null);
    setPreview(null);
    setError('');
    
    if (onPhotoRemove) {
      onPhotoRemove();
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setPhoto(null);
    setPreview(null);
    setError('');
    fileInputRef.current?.click();
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeColor = () => {
    return type === 'before' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getTypeIcon = () => {
    return type === 'before' ? '📸' : '✅';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Photo Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {type === 'before' ? 'Before' : 'After'} Photo
            <Badge className={getTypeColor()}>
              {getTypeIcon()} {type.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!photo ? (
            <div
              className="text-center p-6"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload {type === 'before' ? 'Before' : 'After'} Photo
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop an image here, or{' '}
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
                <p>Supported formats: JPEG, PNG, GIF, WebP</p>
                <p>Max file size: 10MB</p>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_FILE_TYPES.images.join(',')}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              {/* Upload Button */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-4"
              >
                <Camera className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : `Select ${type} Photo`}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Photo Preview */}
              <div className="relative">
                <img
                  src={preview || photo.url}
                  alt={`${type} photo`}
                  className="w-full h-64 object-cover rounded-lg border"
                />
                
                {/* Photo Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-3 rounded-b-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{photo.originalName || photo.publicId}</p>
                      <p className="text-sm opacity-90">
                        {photo.format?.toUpperCase()} • {formatFileSize(photo.size)}
                        {photo.width && photo.height && ` • ${photo.width}×${photo.height}`}
                      </p>
                    </div>
                    <Badge className="bg-white text-black">
                      {getTypeIcon()} {type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Photo Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(photo.url, '_blank')}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Size
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = photo.url;
                    link.download = photo.publicId;
                    link.click();
                  }}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  variant="outline"
                  onClick={removePhoto}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Photo Details */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Photo Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Public ID: {photo.publicId}</div>
                  <div>Format: {photo.format?.toUpperCase()}</div>
                  <div>Size: {formatFileSize(photo.size)}</div>
                  <div>Uploaded: {new Date(photo.uploadedAt).toLocaleString()}</div>
                  {photo.width && photo.height && (
                    <>
                      <div>Width: {photo.width}px</div>
                      <div>Height: {photo.height}px</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
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
