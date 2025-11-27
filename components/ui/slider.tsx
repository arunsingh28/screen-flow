
import React from "react";
import { cn } from "../../lib/utils";

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, min = 0, max = 100, step = 1, onValueChange, ...props }, ref) => {
    return (
      <div className="relative flex w-full touch-none select-none items-center">
        <input
          type="range"
          className={cn(
            "h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary disabled:cursor-not-allowed disabled:opacity-50",
            "accent-primary", 
            className
          )}
          min={min}
          max={max}
          step={step}
          value={value}
          ref={ref}
          onChange={(e) => onValueChange?.(Number(e.target.value))}
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
