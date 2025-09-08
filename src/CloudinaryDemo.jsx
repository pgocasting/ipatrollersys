import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { 
  Upload, 
  Image, 
  Video, 
  FileText, 
  Settings, 
  Cloud,
  Database,
  Shield,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import CloudinaryUpload from './components/CloudinaryUpload';
import CloudinaryManager from './components/CloudinaryManager';
import { cloudinaryUtils, clientUploadUtils } from './utils/cloudinary';

export default function CloudinaryDemo() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadResults, setUploadResults] = useState([]);
  const [configInfo, setConfigInfo] = useState(null);

  const handleUploadComplete = (files) => {
    console.log('✅ Upload completed:', files);
    setUploadResults(prev => [...prev, ...files]);
  };

  const handleUploadError = (errors) => {
    console.error('❌ Upload errors:', errors);
  };

  const testCloudinaryConnection = async () => {
    try {
      const config = cloudinaryUtils.getConfig();
      setConfigInfo(config);
      console.log('✅ Cloudinary configuration loaded:', config);
    } catch (error) {
      console.error('❌ Failed to load Cloudinary config:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Cloud className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Cloudinary Integration</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete file management solution for images, videos, and documents with Cloudinary integration
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="text-sm">
              Cloud Name: duooicxyl
            </Badge>
            <Badge variant="outline" className="text-sm">
              Upload Preset: Files_Upload
            </Badge>
            <Badge variant="outline" className="text-sm">
              API Key: 193961254783825
            </Badge>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">File Upload</h3>
              <p className="text-gray-600 text-sm">
                Drag & drop interface for images, videos, and documents with progress tracking
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Database className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">File Management</h3>
              <p className="text-gray-600 text-sm">
                Organize, search, and manage all your uploaded files with advanced filtering
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="p-3 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Storage</h3>
              <p className="text-gray-600 text-sm">
                Enterprise-grade cloud storage with automatic optimization and CDN delivery
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Manage Files
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Test Tools
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  File Upload Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CloudinaryUpload
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  allowedTypes={['image', 'video', 'file']}
                  maxFiles={20}
                  maxFileSize={100 * 1024 * 1024} // 100MB
                  folder="ipatroller/demo"
                />
              </CardContent>
            </Card>

            {/* Upload Results */}
            {uploadResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Recent Uploads ({uploadResults.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadResults.slice(-6).map((file, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          {file.format?.startsWith('image') ? (
                            <Image className="h-4 w-4 text-blue-500" />
                          ) : file.format?.startsWith('video') ? (
                            <Video className="h-4 w-4 text-red-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm font-medium truncate">{file.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          <p>Format: {file.format?.toUpperCase()}</p>
                          <p>Uploaded: {new Date(file.uploadedAt).toLocaleString()}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                          className="w-full"
                        >
                          View File
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage">
            <CloudinaryManager />
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cloudinary Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Cloud Name</label>
                    <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                      duooicxyl
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">API Key</label>
                    <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                      193961254783825
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Upload Preset</label>
                    <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                      Files_Upload
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">API Secret</label>
                    <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                      Set in environment variables
                    </div>
                  </div>
                </div>

                <Button onClick={testCloudinaryConnection} className="w-full">
                  Test Connection
                </Button>

                {configInfo && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Configuration Loaded Successfully</span>
                    </div>
                    <pre className="mt-2 text-sm text-green-700 bg-green-100 p-2 rounded">
                      {JSON.stringify(configInfo, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      <strong>API Secret:</strong> For security, the API secret should be stored in environment variables 
                      (REACT_APP_CLOUDINARY_API_SECRET) and not exposed in client-side code.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      <strong>Upload Preset:</strong> The "Files_Upload" preset allows unsigned uploads for client-side 
                      file uploads without requiring server-side authentication.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      <strong>File Limits:</strong> Cloudinary has file size and format restrictions. Check their 
                      documentation for current limits and supported formats.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      <strong>Security:</strong> Consider implementing upload restrictions, file type validation, 
                      and user authentication for production use.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Tools Tab */}
          <TabsContent value="test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Testing & Development Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const config = cloudinaryUtils.getConfig();
                      console.log('Cloudinary Config:', config);
                      alert('Check browser console for configuration details');
                    }}
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <Settings className="h-6 w-6" />
                    <span>Get Config</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const signature = cloudinaryUtils.generateUploadSignature();
                      console.log('Upload Signature:', signature);
                      alert('Check browser console for signature details');
                    }}
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <Shield className="h-6 w-6" />
                    <span>Generate Signature</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      console.log('Available Cloudinary Utils:', Object.keys(cloudinaryUtils));
                      console.log('Available Client Utils:', Object.keys(clientUploadUtils));
                      alert('Check browser console for available utilities');
                    }}
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <Database className="h-6 w-6" />
                    <span>List Utilities</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open('https://cloudinary.com/documentation', '_blank');
                    }}
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <Cloud className="h-6 w-6" />
                    <span>Cloudinary Docs</span>
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Browser Console Commands</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Open your browser's developer console and try these commands:
                  </p>
                  <div className="space-y-1 text-xs font-mono text-blue-600">
                    <p>• cloudinaryUtils.getConfig()</p>
                    <p>• cloudinaryUtils.generateUploadSignature()</p>
                    <p>• clientUploadUtils.uploadToCloudinary(file, options)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center py-8 border-t">
          <p className="text-gray-600">
            Powered by <strong>Cloudinary</strong> - Professional cloud media management platform
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Button
              variant="link"
              onClick={() => window.open('https://cloudinary.com', '_blank')}
              className="text-blue-600"
            >
              Visit Cloudinary
            </Button>
            <Button
              variant="link"
              onClick={() => window.open('https://cloudinary.com/documentation', '_blank')}
              className="text-blue-600"
            >
              Documentation
            </Button>
            <Button
              variant="link"
              onClick={() => window.open('https://cloudinary.com/console', '_blank')}
              className="text-blue-600"
            >
              Console
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
