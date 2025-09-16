import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './chart';

const BarChart = ({ data, className = "" }) => {
  const { labels, datasets } = data;
  const dataset = datasets[0];
  const maxValue = Math.max(...dataset.data);
  
  return (
    <ChartContainer className={`p-4 ${className}`}>
      <div className="flex items-end justify-between h-full gap-2">
        {labels.map((label, index) => {
          const value = dataset.data[index];
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const color = Array.isArray(dataset.backgroundColor) 
            ? dataset.backgroundColor[index] || dataset.backgroundColor[0]
            : dataset.backgroundColor;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 group">
              <div className="relative w-full flex items-end justify-center mb-2" style={{ height: '200px' }}>
                <div
                  className="w-full max-w-12 rounded-t-md transition-all duration-300 hover:opacity-80 relative group"
                  style={{
                    height: `${height}%`,
                    backgroundColor: color,
                    minHeight: value > 0 ? '4px' : '0px'
                  }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    {dataset.label}: {value}
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-600 text-center">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </ChartContainer>
  );
};

export { BarChart };
