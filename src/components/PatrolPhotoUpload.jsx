import React, { useState, useRef } from 'react';


const PatrolPhotoUpload = ({ 
  monthKey, 
  municipality, 
  district, 
  onPhotosUpdated,
  className = "" 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Starting upload...');
    
    try {
      // Convert FileList to Array
      const fileArray = Array.from(files);
      
      // Validate files
      const validFiles = fileArray.filter(file => {
        const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
        
        if (!isValidType) {
          setUploadStatus(`❌ Invalid file type: ${file.name}. Only images are allowed.`);
          return false;
        }
        
        if (!isValidSize) {
          setUploadStatus(`❌ File too large: ${file.name}. Maximum size is 10MB.`);
          return false;
        }
        
        return true;
      });
      
      if (validFiles.length === 0) {
        setUploadStatus('❌ No valid files to upload');
        setIsUploading(false);
        return;
      }
      
      setUploadStatus(`📤 Uploading ${validFiles.length} photo(s)...`);
      
      // Upload photos using the integration utility
      console.warn('⚠️ Firebase has been removed from this project');
      const result = { success: false, error: 'Firebase has been removed from this project' };
      
      if (result.success) {
        setUploadProgress(100);
        setUploadStatus(`✅ ${result.data.count} photo(s) uploaded successfully!`);
        
        // Notify parent component
        if (onPhotosUpdated) {
          onPhotosUpdated(result.data.files);
        }
        
        // Reset after 3 seconds
        setTimeout(() => {
          setUploadStatus('');
          setUploadProgress(0);
        }, 3000);
      } else {
        setUploadStatus(`❌ Upload failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`❌ Upload error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`patrol-photo-upload ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {/* Upload area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-75' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        {/* Upload icon */}
        <div className="mx-auto w-12 h-12 mb-4">
          {isUploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          ) : (
            <svg 
              className="w-12 h-12 mx-auto text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          )}
        </div>
        
        {/* Upload text */}
        <div className="space-y-2">
          {isUploading ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">{uploadStatus}</p>
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700">
                Upload Patrol Photos
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop photos here, or click to select files
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supports: JPG, PNG, GIF, WebP • Max: 10MB per file
              </p>
            </div>
          )}
        </div>
        
        {/* Upload button (hidden when uploading) */}
        {!isUploading && (
          <button
            type="button"
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            onClick={handleButtonClick}
          >
            Select Photos
          </button>
        )}
      </div>
      
      {/* Upload status */}
      {uploadStatus && (
        <div className={`mt-3 p-3 rounded-md text-sm ${
          uploadStatus.includes('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : uploadStatus.includes('❌')
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
};

export default PatrolPhotoUpload;
