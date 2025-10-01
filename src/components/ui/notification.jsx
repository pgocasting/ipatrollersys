import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';

const Notification = ({ 
  message, 
  type = 'success', 
  isVisible, 
  onClose, 
  duration = 5000,
  position = 'top-right' 
}) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const handleClose = () => {
    setShow(false);
    if (onClose) {
      setTimeout(onClose, 300); // Wait for animation to complete
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <X className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <div className="w-5 h-5 rounded-full bg-yellow-600 flex items-center justify-center text-white text-xs font-bold">!</div>;
      case 'info':
        return <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">i</div>;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (!show) return null;

  return (
    <div className={`fixed z-50 ${getPositionStyles()}`}>
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
        ${getTypeStyles()}
        transform transition-all duration-300 ease-in-out
        ${show ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}
        max-w-md min-w-[300px]
      `}>
        {getIcon()}
        <span className="flex-1 text-sm font-medium">
          {message}
        </span>
        <button
          onClick={handleClose}
          className="ml-2 p-1 rounded-full hover:bg-black/10 transition-colors duration-200"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Hook for managing notifications
export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'success', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (message, duration) => showNotification(message, 'success', duration);
  const showError = (message, duration) => showNotification(message, 'error', duration);
  const showWarning = (message, duration) => showNotification(message, 'warning', duration);
  const showInfo = (message, duration) => showNotification(message, 'info', duration);

  return {
    notifications,
    showNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// Notification Container component
export const NotificationContainer = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          isVisible={true}
          onClose={() => onRemove(notification.id)}
          duration={0} // Duration handled by the hook
        />
      ))}
    </div>
  );
};

export default Notification;
