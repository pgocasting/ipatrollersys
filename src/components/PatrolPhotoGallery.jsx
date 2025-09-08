import React, { useState, useEffect } from 'react';


const PatrolPhotoGallery = ({ 
  monthKey, 
  municipality, 
  district, 
  className = "" 
}) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load photos from Firebase
  useEffect(() => {
    const loadPhotos = async () => {
      if (!monthKey || !municipality || !district) return;
      
      setLoading(true);
      try {
            console.warn('⚠️ Firebase has been removed from this project');
    const result = { success: false, error: 'Firebase has been removed from this project' };
        
        if (result.success) {
          setPhotos(result.data);
        } else {
          console.error('Failed to load photos:', result.error);
        }
      } catch (error) {
        console.error('Error loading photos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [monthKey, municipality, district]);

  // Handle photo click to open modal
  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedPhoto(null);
  };

  // Handle photo deletion
  const handleDeletePhoto = async (photo) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      console.warn('⚠️ Firebase has been removed from this project');
    const result = { success: false, error: 'Firebase has been removed from this project' };
      if (result.success) {
        // Remove photo from local state
        setPhotos(prev => prev.filter(p => p.publicId !== photo.publicId));
      } else {
        alert('Failed to delete photo: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Error deleting photo: ' + error.message);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format upload date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`patrol-photo-gallery ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading photos...</span>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className={`patrol-photo-gallery ${className}`}>
        <div className="text-center p-8 text-gray-500">
          <svg 
            className="w-16 h-16 mx-auto text-gray-300 mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <p className="text-lg font-medium">No photos uploaded yet</p>
          <p className="text-sm">Upload photos to see them displayed here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`patrol-photo-gallery ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Patrol Photos ({photos.length})
        </h3>
        <div className="text-sm text-gray-500">
          {municipality}, {district}
        </div>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div 
            key={photo.publicId || index}
            className="relative group cursor-pointer"
            onClick={() => handlePhotoClick(photo)}
          >
            {/* Photo thumbnail */}
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-blue-300 transition-colors">
              <img
                src={photo.url}
                alt={`Patrol photo ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </div>
            
            {/* Photo info overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg">
              <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex items-center justify-between">
                  <span>{formatFileSize(photo.size)}</span>
                  <span>{photo.format?.toUpperCase()}</span>
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  {formatDate(photo.uploadedAt)}
                </div>
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePhoto(photo);
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Delete photo"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Photo modal */}
      {showModal && selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="relative max-w-4xl max-h-full">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full hover:bg-black focus:outline-none focus:ring-2 focus:ring-white"
            >
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Photo */}
            <img
              src={selectedPhoto.url}
              alt="Patrol photo"
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Photo details */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-300">Format:</span>
                  <span className="ml-2">{selectedPhoto.format?.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-gray-300">Size:</span>
                  <span className="ml-2">{formatFileSize(selectedPhoto.size)}</span>
                </div>
                <div>
                  <span className="text-gray-300">Uploaded:</span>
                  <span className="ml-2">{formatDate(selectedPhoto.uploadedAt)}</span>
                </div>
                <div>
                  <span className="text-gray-300">Category:</span>
                  <span className="ml-2 capitalize">{selectedPhoto.category}</span>
                </div>
              </div>
              
              {/* Download link */}
              <div className="mt-3">
                <a
                  href={selectedPhoto.url}
                  download
                  className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatrolPhotoGallery;
