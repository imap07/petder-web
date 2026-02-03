'use client';

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';

type ScaleType = 'linear' | 'logarithmic' | 'quadratic';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  disabled?: boolean;
  className?: string;
  /** Scale type: 'linear' (default), 'logarithmic', or 'quadratic' */
  scale?: ScaleType;
  /** Show tick marks at specific values */
  ticks?: number[];
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  valueFormatter = (v) => v.toString(),
  disabled = false,
  className = '',
  scale = 'linear',
  ticks,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Scale conversion functions
  const scaleUtils = useMemo(() => {
    const safeMin = min <= 0 ? 1 : min;
    
    switch (scale) {
      case 'logarithmic':
        return {
          // Value to percentage (0-100)
          valueToPercent: (val: number) => {
            const safeVal = Math.max(safeMin, val);
            const logMin = Math.log(safeMin);
            const logMax = Math.log(max);
            const logVal = Math.log(safeVal);
            return ((logVal - logMin) / (logMax - logMin)) * 100;
          },
          // Percentage to value
          percentToValue: (pct: number) => {
            const logMin = Math.log(safeMin);
            const logMax = Math.log(max);
            const logVal = logMin + (pct / 100) * (logMax - logMin);
            return Math.exp(logVal);
          },
        };
      case 'quadratic':
        return {
          // Value to percentage - quadratic gives more space to smaller values
          valueToPercent: (val: number) => {
            const normalized = (val - min) / (max - min);
            return Math.sqrt(normalized) * 100;
          },
          // Percentage to value
          percentToValue: (pct: number) => {
            const normalized = (pct / 100) ** 2;
            return min + normalized * (max - min);
          },
        };
      default: // linear
        return {
          valueToPercent: (val: number) => ((val - min) / (max - min)) * 100,
          percentToValue: (pct: number) => min + (pct / 100) * (max - min),
        };
    }
  }, [min, max, scale]);

  const percentage = scaleUtils.valueToPercent(value);

  const updateValue = useCallback(
    (clientX: number) => {
      if (!trackRef.current || disabled) return;

      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const width = rect.width;
      const rawPercentage = Math.max(0, Math.min(100, (x / width) * 100));
      const rawValue = scaleUtils.percentToValue(rawPercentage);
      const steppedValue = Math.round(rawValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));

      onChange(clampedValue);
    },
    [min, max, step, onChange, disabled, scaleUtils]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      setIsDragging(true);
      updateValue(e.clientX);
    },
    [updateValue, disabled]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      setIsDragging(true);
      updateValue(e.touches[0].clientX);
    },
    [updateValue, disabled]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateValue(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      updateValue(e.touches[0].clientX);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, updateValue]);

  // Keyboard support
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      let newValue = value;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          newValue = Math.min(max, value + step);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          newValue = Math.max(min, value - step);
          break;
        case 'Home':
          newValue = min;
          break;
        case 'End':
          newValue = max;
          break;
        default:
          return;
      }
      e.preventDefault();
      onChange(newValue);
    },
    [value, min, max, step, onChange, disabled]
  );

  return (
    <div className={`${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-3">
          {label && (
            <label className="text-sm font-medium text-text">{label}</label>
          )}
          {showValue && (
            <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {valueFormatter(value)}
            </span>
          )}
        </div>
      )}

      <div
        ref={trackRef}
        className={`
          relative h-3 rounded-full cursor-pointer select-none
          ${disabled ? 'bg-border cursor-not-allowed' : 'bg-border'}
        `}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
      >
        {/* Filled track */}
        <div
          className={`
            absolute left-0 top-0 h-full rounded-full transition-all
            ${disabled ? 'bg-text-muted' : 'bg-primary'}
          `}
          style={{ width: `${percentage}%` }}
        />

        {/* Thumb */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 -translate-x-1/2
            w-6 h-6 rounded-full transition-all
            ${disabled 
              ? 'bg-text-muted' 
              : isDragging 
                ? 'bg-primary scale-125' 
                : 'bg-foreground border-4 border-primary hover:scale-110'
            }
          `}
          style={{ left: `${percentage}%` }}
        />
      </div>

      {/* Tick marks */}
      {ticks && ticks.length > 0 && (
        <div className="relative h-4 mt-1">
          {ticks.map((tick) => {
            const tickPercent = scaleUtils.valueToPercent(tick);
            const isActive = value >= tick;
            return (
              <button
                key={tick}
                type="button"
                onClick={() => !disabled && onChange(tick)}
                className={`
                  absolute -translate-x-1/2 flex flex-col items-center
                  ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                  transition-transform
                `}
                style={{ left: `${tickPercent}%` }}
                disabled={disabled}
              >
                <div
                  className={`
                    w-1.5 h-1.5 rounded-full mb-1
                    ${isActive ? 'bg-primary' : 'bg-border'}
                  `}
                />
                <span
                  className={`
                    text-[10px] font-medium whitespace-nowrap
                    ${value === tick ? 'text-primary font-bold' : 'text-text-muted'}
                  `}
                >
                  {valueFormatter(tick)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Min/Max labels (only show if no ticks) */}
      {!ticks && (
        <div className="flex justify-between mt-2">
          <span className="text-xs text-text-muted">{valueFormatter(min)}</span>
          <span className="text-xs text-text-muted">{valueFormatter(max)}</span>
        </div>
      )}
    </div>
  );
}
