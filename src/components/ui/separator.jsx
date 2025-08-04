import React from "react";

export function Separator({ className = "", orientation = "horizontal", decorative = true, ...props }) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={`shrink-0 bg-border ${orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"} ${className}`}
      {...props}
    />
  );
} 