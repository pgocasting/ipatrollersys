import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { 
  Cloud, 
  Image, 
  Video, 
  FileText, 
  Upload, 
  Camera,
  Database,
  Settings
} from 'lucide-react';
import FileUpload from './components/FileUpload';
import PhotoUpload from './components/PhotoUpload';
import MediaGallery from './components/MediaGallery';
import { cloudinaryConfig } from './utils/cloudinary';

export default function CloudinaryDemo() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setBeforePhoto] = useState(null);

  // Handle file upload completion
  const handleFileUpload = (result) => {
    if (result.success) {
      const newFiles = Array.isArray(result.successful) ? result.successful : [result];
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Handle file upload error
  const handleFileUploadError = (error) => {
    console.error('File upload error:', error);
  };

  // Handle photo upload
  const handlePhotoUpload = (photoData) => {
    console.log('Photo uploaded:', photoData);
  };

  // Handle photo removal
  const handlePhotoRemove = () => {
    console.log('Photo removed');
  };

  // Handle file deletion
  const handleFileDelete = (file) => {
    setUploadedFiles(prev => prev.filter(f => f !== file));
  };

  // Handle file view
  const handleFileView = (file) => {
    console.log('Viewing file:', file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Cloud className="h-12 w-12 text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-900">Cloudinary Integration Demo</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive file, image, and video management using Cloudinary for the IPatroller System
          </p>
        </div>

        {/* Configuration Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cloudinary Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Cloud Name</h4>
                <p className="text-blue-700">{cloudinaryConfig.cloudName}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Upload Preset</h4>
                <p className="text-green-700">{cloudinaryConfig.uploadPreset}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">API Key</h4>
                <p className="text-purple-700">{cloudinaryConfig.apiKey}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              General File Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              multiple={true}
              maxFiles={10}
              folder="ipatroller/demo"
              tags={['demo', 'test']}
              onUploadComplete={handleFileUpload}
              onUploadError={handleFileUploadError}
            />
          </CardContent>
        </Card>

        {/* Photo Upload Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Before Photo Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUpload
                type="before"
                onPhotoUpload={handlePhotoUpload}
                onPhotoRemove={handlePhotoRemove}
                existingPhoto={beforePhoto}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                After Photo Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUpload
                type="after"
                onPhotoUpload={handlePhotoUpload}
                onPhotoRemove={handlePhotoRemove}
                existingPhoto={afterPhoto}
              />
            </CardContent>
          </Card>
        </div>

        {/* Media Gallery Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Media Gallery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MediaGallery
              files={uploadedFiles}
              onFileDelete={handleFileDelete}
              onFileView={handleFileView}
              title="Uploaded Files"
            />
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-blue-500" />
                Image Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">JPEG</Badge>
                  <Badge variant="outline">PNG</Badge>
                  <Badge variant="outline">GIF</Badge>
                  <Badge variant="outline">WebP</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  High-quality image uploads with automatic optimization and transformation capabilities.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-purple-500" />
                Video Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">MP4</Badge>
                  <Badge variant="outline">AVI</Badge>
                  <Badge variant="outline">MOV</Badge>
                  <Badge variant="outline">WMV</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Video file support with streaming optimization and thumbnail generation.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                Document Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">DOC</Badge>
                  <Badge variant="outline">DOCX</Badge>
                  <Badge variant="outline">TXT</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Document upload support for reports, forms, and other text-based files.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Technical Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Upload Features</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Drag & drop file uploads</li>
                  <li>• Multiple file selection</li>
                  <li>• File type validation</li>
                  <li>• File size limits</li>
                  <li>• Progress indicators</li>
                  <li>• Error handling</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Cloudinary Benefits</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Automatic image optimization</li>
                  <li>• CDN delivery worldwide</li>
                  <li>• Secure file storage</li>
                  <li>• Transformations on-the-fly</li>
                  <li>• Backup and redundancy</li>
                  <li>• Analytics and insights</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Usage Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Basic File Upload</h4>
                <pre className="text-sm bg-gray-800 text-white p-3 rounded overflow-x-auto">
{`import FileUpload from './components/FileUpload';

<FileUpload
  multiple={true}
  maxFiles={5}
  folder="ipatroller/documents"
  onUploadComplete={handleUpload}
/>`}
                </pre>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Photo Upload</h4>
                <pre className="text-sm bg-gray-800 text-white p-3 rounded overflow-x-auto">
{`import PhotoUpload from './components/PhotoUpload';

<PhotoUpload
  type="before"
  onPhotoUpload={handlePhotoUpload}
  onPhotoRemove={handlePhotoRemove}
/>`}
                </pre>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Media Gallery</h4>
                <pre className="text-sm bg-gray-800 text-white p-3 rounded overflow-x-auto">
{`import MediaGallery from './components/MediaGallery';

<MediaGallery
  files={uploadedFiles}
  onFileDelete={handleDelete}
  onFileView={handleView}
/>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-500">
            Cloudinary integration provides robust file management for the IPatroller System
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Cloud className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-400">
              Powered by Cloudinary
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
