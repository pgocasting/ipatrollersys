import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Image, 
  Video, 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Grid3X3, 
  List,
  Filter,
  Search,
  Calendar,
  FileImage,
  FileVideo,
  File,
  X
} from 'lucide-react';

export default function MediaGallery({ 
  files = [], 
  onFileDelete, 
  onFileView,
  title = 'Media Gallery',
  className = ''
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterType, setFilterType] = useState('all'); // 'all', 'images', 'videos', 'documents'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Filter files based on search and type
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.publicId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.originalName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || 
                       (filterType === 'images' && file.format && ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(file.format.toLowerCase())) ||
                       (filterType === 'videos' && file.format && ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(file.format.toLowerCase())) ||
                       (filterType === 'documents' && file.format && ['pdf', 'doc', 'docx', 'txt'].includes(file.format.toLowerCase()));

    return matchesSearch && matchesType;
  });

  // Get file icon based on type
  const getFileIcon = (file) => {
    if (file.format && ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(file.format.toLowerCase())) {
      return <FileImage className="h-8 w-8 text-blue-500" />;
    }
    if (file.format && ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(file.format.toLowerCase())) {
      return <FileVideo className="h-8 w-8 text-purple-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get file type category
  const getFileTypeCategory = (file) => {
    if (file.format && ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(file.format.toLowerCase())) {
      return 'image';
    }
    if (file.format && ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(file.format.toLowerCase())) {
      return 'video';
    }
    return 'document';
  };

  // Handle file view
  const handleFileView = (file) => {
    if (onFileView) {
      onFileView(file);
    } else {
      setSelectedFile(file);
    }
  };

  // Handle file download
  const handleFileDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.publicId || file.originalName || 'download';
    link.click();
  };

  // Handle file delete
  const handleFileDelete = (file) => {
    if (onFileDelete) {
      onFileDelete(file);
    }
  };

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredFiles.map((file, index) => (
        <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative">
            {/* File Preview */}
            {getFileTypeCategory(file) === 'image' ? (
              <img
                src={file.url}
                alt={file.publicId || 'Image'}
                className="w-full h-48 object-cover"
              />
            ) : getFileTypeCategory(file) === 'video' ? (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <Video className="h-16 w-16 text-gray-400" />
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <FileText className="h-16 w-16 text-gray-400" />
              </div>
            )}

            {/* File Type Badge */}
            <Badge className="absolute top-2 right-2">
              {getFileTypeCategory(file).toUpperCase()}
            </Badge>
          </div>

          <CardContent className="p-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm truncate" title={file.publicId || file.originalName}>
                {file.publicId || file.originalName || `File ${index + 1}`}
              </h4>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {getFileIcon(file)}
                <span>{file.format?.toUpperCase()}</span>
                <span>•</span>
                <span>{formatFileSize(file.size)}</span>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileView(file)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileDownload(file)}
                  className="flex-1"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileDelete(file)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render list view
  const renderListView = () => (
    <div className="space-y-2">
      {filteredFiles.map((file, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* File Icon */}
              <div className="flex-shrink-0">
                {getFileIcon(file)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate" title={file.publicId || file.originalName}>
                  {file.publicId || file.originalName || `File ${index + 1}`}
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span>{file.format?.toUpperCase()}</span>
                  <span>•</span>
                  <span>{formatFileSize(file.size)}</span>
                  {file.width && file.height && (
                    <>
                      <span>•</span>
                      <span>{file.width}×{file.height}</span>
                    </>
                  )}
                  {file.uploadedAt && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(file.uploadedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* File Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileView(file)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileDownload(file)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileDelete(file)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              {title} ({filteredFiles.length} files)
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex-shrink-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="images">Images</option>
                <option value="videos">Videos</option>
                <option value="documents">Documents</option>
              </select>
            </div>
          </div>

          {/* Files Display */}
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No files have been uploaded yet'
                }
              </p>
            </div>
          ) : (
            viewMode === 'grid' ? renderGridView() : renderListView()
          )}
        </CardContent>
      </Card>

      {/* File Viewer Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {selectedFile.publicId || selectedFile.originalName}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4">
              {getFileTypeCategory(selectedFile) === 'image' ? (
                <img
                  src={selectedFile.url}
                  alt={selectedFile.publicId || 'Image'}
                  className="max-w-full h-auto"
                />
              ) : getFileTypeCategory(selectedFile) === 'video' ? (
                <video
                  src={selectedFile.url}
                  controls
                  className="max-w-full h-auto"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Preview not available for this file type
                  </p>
                  <Button onClick={() => handleFileDownload(selectedFile)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
