import React from 'react';

function DebugComponent({ children }) {
  // In development mode, you can add debugging features here
  // For now, it just renders children normally
  return <>{children}</>;
}

export default DebugComponent; 