import React from 'react';

const Tabs = ({ value, onValueChange, className = "", children }) => {
  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ className = "", children }) => {
  return (
    <div className={`flex space-x-1 rounded-lg bg-muted p-1 ${className}`}>
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, onValueChange, className = "", children, ...props }) => {
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ${className}`}
      onClick={() => onValueChange(value)}
      data-state={value === value ? 'active' : 'inactive'}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, className = "", children }) => {
  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
};

export { Tabs, TabsContent, TabsList, TabsTrigger };
