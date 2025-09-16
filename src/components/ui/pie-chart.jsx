"use client"

import * as React from "react"
import { Label, Pie, PieChart as RechartsPieChart, Sector } from "recharts"
import { PieChart as PieChartIcon } from "lucide-react"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./chart"

const PieChart = ({ data, className = "", title = "District Distribution" }) => {
  // Handle undefined or invalid data
  if (!data || !data.labels || !data.datasets || !data.datasets[0]) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-100">
          <PieChartIcon className="h-5 w-5 text-blue-600" />
        </div>
      </div>
    );
  }

  const { labels, datasets } = data;
  const dataset = datasets[0];
  
  // Transform data to Recharts format
  const chartData = labels.map((label, index) => ({
    name: label,
    value: dataset.data[index] || 0,
    fill: dataset.backgroundColor[index] || '#E5E7EB',
  }));

  const [activeIndex, setActiveIndex] = React.useState(0)

  const total = React.useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.value, 0),
    [chartData]
  )

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex flex-1 justify-center pb-0">
        <ChartContainer className="mx-auto aspect-square w-full max-w-[250px]">
          <RechartsPieChart width={250} height={250}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              strokeWidth={2}
              activeIndex={activeIndex}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              activeShape={({
                outerRadius = 0,
                ...props
              }) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 25}
                    innerRadius={outerRadius + 12}
                  />
                </g>
              )}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-black text-2xl font-bold"
                        >
                          {chartData[activeIndex]?.value?.toLocaleString() || 0}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-gray-600 text-sm"
                        >
                          Patrols
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </RechartsPieChart>
        </ChartContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-2 px-4">
        {chartData.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-center gap-1 text-xs cursor-pointer transition-opacity ${
              activeIndex === index ? 'opacity-100' : 'opacity-70'
            }`}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: item.fill }}
            ></div>
            <span className="text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { PieChart };
export default PieChart;
