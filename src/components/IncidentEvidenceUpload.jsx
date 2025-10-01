import React, { useState, useRef } from 'react';


const IncidentEvidenceUpload = ({ 
  incidentData, 
  onEvidenceUpdated,
  className = "" 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileTypes, setSelectedFileTypes] = useState(['image', 'video', 'document']);
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
      
      // Validate files based on selected types
      const validFiles = fileArray.filter(file => {
        const fileType = getFileType(file.type);
        const isValidType = selectedFileTypes.includes(fileType);
        const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
        
        if (!isValidType) {
          setUploadStatus(`❌ Invalid file type: ${file.name}. Selected types: ${selectedFileTypes.join(', ')}`);
          return false;
        }
        
        if (!isValidSize) {
          setUploadStatus(`❌ File too large: ${file.name}. Maximum size is 50MB.`);
          return false;
        }
        
        return true;
      });
      
      if (validFiles.length === 0) {
        setUploadStatus('❌ No valid files to upload');
        setIsUploading(false);
        return;
      }
      
      setUploadStatus(`📤 Uploading ${validFiles.length} evidence file(s)...`);
      
      // Upload evidence using the integration utility
      console.warn('⚠️ Firebase has been removed from this project');
      const result = { success: false, error: 'Firebase has been removed from this project' };
      
      if (result.success) {
        setUploadProgress(100);
        setUploadStatus(`✅ ${result.data.count} evidence file(s) uploaded successfully!`);
        
        // Notify parent component
        if (onEvidenceUpdated) {
          onEvidenceUpdated(result.data.files);
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

  // Get file type from MIME type
  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document';
    return 'file';
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

  // Toggle file type selection
  const toggleFileType = (type) => {
    setSelectedFileTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Get accepted file types for input
  const getAcceptedTypes = () => {
    const typeMap = {
      image: 'image/*',
      video: 'video/*',
      document: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf'
    };
    
    return selectedFileTypes
      .map(type => typeMap[type])
      .filter(Boolean)
      .join(',');
  };

  return (
    <div className={`incident-evidence-upload ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={getAcceptedTypes()}
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {/* File type selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          File Types to Accept:
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { type: 'image', label: 'Images', icon: '📷' },
            { type: 'video', label: 'Videos', icon: '🎥' },
            { type: 'document', label: 'Documents', icon: '📄' }
          ].map(({ type, label, icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleFileType(type)}
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${selectedFileTypes.includes(type)
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }
              `}
            >
              <span className="mr-2">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
      
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
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
                Upload Incident Evidence
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop evidence files here, or click to select files
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Selected types: {selectedFileTypes.join(', ')} • Max: 50MB per file
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
            Select Evidence Files
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
      
      {/* Incident info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Incident Details:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">Type:</span> {incidentData.incidentType || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Location:</span> {incidentData.municipality}, {incidentData.district}
          </div>
          <div>
            <span className="font-medium">Date:</span> {incidentData.date || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Status:</span> {incidentData.status || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentEvidenceUpload;
