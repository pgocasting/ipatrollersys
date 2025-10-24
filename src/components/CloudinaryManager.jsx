import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download, 
  Trash2, 
  Eye, 
  Copy, 
  RefreshCw,
  Image,
  Video,
  FileText,
  Folder,
  Calendar,
  HardDrive,
  Settings
} from 'lucide-react';
import { cloudinaryUtils } from '../utils/cloudinary';

export default function CloudinaryManager() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [sortBy, setSortBy] = useState('uploadedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Mock data for demonstration (replace with actual Cloudinary API calls)
  const mockResources = [
    {
      id: '1',
      publicId: 'ipatroller/images/patrol_photo_1',
      url: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Patrol+Photo',
      name: 'patrol_photo_1.jpg',
      format: 'jpg',
      type: 'image',
      size: 245760,
      width: 1920,
      height: 1080,
      folder: 'ipatroller/images',
      uploadedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      publicId: 'ipatroller/videos/incident_video_1',
      url: 'https://via.placeholder.com/300x200/DC2626/FFFFFF?text=Incident+Video',
      name: 'incident_video_1.mp4',
      format: 'mp4',
      type: 'video',
      size: 5242880,
      width: 1920,
      height: 1080,
      duration: 45.2,
      folder: 'ipatroller/videos',
      uploadedAt: '2024-01-14T15:45:00Z'
    },
    {
      id: '3',
      publicId: 'ipatroller/files/report_document_1',
      url: 'https://via.placeholder.com/300x200/059669/FFFFFF?text=Report+Document',
      name: 'report_document_1.pdf',
      format: 'pdf',
      type: 'file',
      size: 1048576,
      folder: 'ipatroller/files',
      uploadedAt: '2024-01-13T09:15:00Z'
    }
  ];

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would call Cloudinary API here
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResources(mockResources);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort resources
  const filteredResources = resources
    .filter(resource => {
      const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.publicId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || resource.type === selectedType;
      const matchesFolder = selectedFolder === 'all' || resource.folder === selectedFolder;
      
      return matchesSearch && matchesType && matchesFolder;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'uploadedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get unique folders
  const folders = [...new Set(resources.map(r => r.folder))];

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get file icon
  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'file': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  // Copy URL to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Delete resource
  const deleteResource = async (publicId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const result = await cloudinaryUtils.deleteResource(publicId);
        if (result.success) {
          setResources(prev => prev.filter(r => r.publicId !== publicId));
        }
      } catch (error) {
        console.error('Failed to delete resource:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cloudinary Manager</h1>
          <p className="text-gray-600">Manage your uploaded images, videos, and files</p>
        </div>
        <Button onClick={loadResources} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Image className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resources.filter(r => r.type === 'image').length}</p>
                <p className="text-sm text-gray-600">Images</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Video className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resources.filter(r => r.type === 'video').length}</p>
                <p className="text-sm text-gray-600">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resources.filter(r => r.type === 'file').length}</p>
                <p className="text-sm text-gray-600">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <HardDrive className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatFileSize(resources.reduce((total, r) => total + r.size, 0))}
                </p>
                <p className="text-sm text-gray-600">Total Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search-files"
                  name="search-files"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
              >
                All
              </Button>
              <Button
                variant={selectedType === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('image')}
              >
                <Image className="h-4 w-4 mr-1" />
                Images
              </Button>
              <Button
                variant={selectedType === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('video')}
              >
                <Video className="h-4 w-4 mr-1" />
                Videos
              </Button>
              <Button
                variant={selectedType === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('file')}
              >
                <FileText className="h-4 w-4 mr-1" />
                Files
              </Button>
            </div>

            {/* Folder Filter */}
            <select
              id="folder-filter"
              name="folder-filter"
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Folders</option>
              {folders.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              id="sort-filter"
              name="sort-filter"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="uploadedAt-desc">Newest First</option>
              <option value="uploadedAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Resources Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Loading resources...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No files found</h3>
            <p className="mt-2 text-gray-600">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="space-y-3">
                    {/* Preview */}
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      {resource.type === 'image' ? (
                        <img
                          src={resource.url}
                          alt={resource.name}
                          className="w-full h-full object-cover"
                        />
                      ) : resource.type === 'video' ? (
                        <video
                          src={resource.url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <p className="font-medium text-sm truncate" title={resource.name}>
                        {resource.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {resource.format?.toUpperCase()}
                        </Badge>
                        <span>{formatFileSize(resource.size)}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(resource.uploadedAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(resource.url, '_blank')}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(resource.url)}
                        className="flex-1"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteResource(resource.publicId)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // List View
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getFileIcon(resource.type)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{resource.name}</p>
                      <p className="text-xs text-gray-500">{resource.publicId}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(resource.size)}</span>
                        <span>{formatDate(resource.uploadedAt)}</span>
                        <Badge variant="outline" className="text-xs">
                          {resource.format?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(resource.url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(resource.url)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteResource(resource.publicId)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
