import React, { useEffect, useState } from 'react';
import { ProgressIndicatorProps } from '../types/components';
import './ProgressIndicator.css';

/**
 * ProgressIndicator component
 * A dynamic progress indicator that supports linear and circular display modes
 * with animation effects and progress messages
 */
const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  message,
  isVisible,
  variant = 'linear',
  className = '',
  showPercentage = true,
  size = 'medium',
  color = '#646cff',
  testId
}) => {
  const [displayProgress, setDisplayProgress] = useState(progress);

  // Animate progress changes
  useEffect(() => {
    // If progress jumps more than 10%, animate it smoothly
    if (Math.abs(progress - displayProgress) > 10) {
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          const diff = progress - prev;
          const step = diff > 0 ? Math.max(1, diff / 10) : Math.min(-1, diff / 10);
          const newValue = prev + step;

          // Stop animation when we reach the target
          if ((diff > 0 && newValue >= progress) || (diff < 0 && newValue <= progress)) {
            clearInterval(interval);
            return progress;
          }
          return newValue;
        });
      }, 20);

      return () => clearInterval(interval);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress]);

  if (!isVisible) return null;

  // Calculate the rotation for circular progress
  const circumference = 2 * Math.PI * 45; // 45 is the radius
  const strokeDashoffset = circumference * (1 - displayProgress / 100);

  // Determine size class
  const sizeClass = `progress-${size}`;

  return (
    <div
      className={`progress-indicator ${variant}-indicator ${sizeClass} ${className}`}
      data-testid={testId}
      style={{ '--progress-color': color } as React.CSSProperties}
    >
      {variant === 'linear' ? (
        <div className="linear-progress-container">
          <div className="progress-message">{message}</div>
          <div className="linear-progress-bar">
            <div
              className="linear-progress-fill"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          {showPercentage && (
            <div className="progress-percentage">{Math.round(displayProgress)}%</div>
          )}
        </div>
      ) : (
        <div className="circular-progress-container">
          <svg className="circular-progress" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className="circular-progress-background"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              className="circular-progress-fill"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
            />
            {showPercentage && (
              <text
                x="50"
                y="50"
                className="circular-progress-text"
                dominantBaseline="middle"
                textAnchor="middle"
              >
                {Math.round(displayProgress)}%
              </text>
            )}
          </svg>
          <div className="progress-message">{message}</div>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;