import React, { useState, useEffect } from 'react';
import { ProgressIndicator } from '../components';
import './progressIndicatorExample.css';

/**
 * Example component demonstrating the usage of ProgressIndicator
 */
const ProgressIndicatorExample: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [variant, setVariant] = useState<'linear' | 'circular'>('linear');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showPercentage, setShowPercentage] = useState(true);
  const [color, setColor] = useState('#646cff');

  // Simulate progress
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() * 5 + 1; // Random increment between 1-6
          const newProgress = prev + increment;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 300);
    } else if (progress >= 100) {
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, progress]);

  // Get message based on progress
  const getMessage = () => {
    if (progress < 25) return '正在加载模型...';
    if (progress < 50) return '正在初始化翻译引擎...';
    if (progress < 75) return '正在处理文本...';
    if (progress < 100) return '即将完成...';
    return '翻译完成！';
  };

  // Reset progress
  const handleReset = () => {
    setProgress(0);
    setIsRunning(false);
  };

  // Start/pause progress
  const handleToggleRunning = () => {
    if (progress >= 100) {
      handleReset();
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  return (
    <div className="progress-example">
      <h2>Progress Indicator Example</h2>

      <div className="controls">
        <div className="control-group">
          <label>
            <input
              type="radio"
              name="variant"
              value="linear"
              checked={variant === 'linear'}
              onChange={() => setVariant('linear')}
            />
            Linear
          </label>
          <label>
            <input
              type="radio"
              name="variant"
              value="circular"
              checked={variant === 'circular'}
              onChange={() => setVariant('circular')}
            />
            Circular
          </label>
        </div>

        <div className="control-group">
          <label>
            <input
              type="radio"
              name="size"
              value="small"
              checked={size === 'small'}
              onChange={() => setSize('small')}
            />
            Small
          </label>
          <label>
            <input
              type="radio"
              name="size"
              value="medium"
              checked={size === 'medium'}
              onChange={() => setSize('medium')}
            />
            Medium
          </label>
          <label>
            <input
              type="radio"
              name="size"
              value="large"
              checked={size === 'large'}
              onChange={() => setSize('large')}
            />
            Large
          </label>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={showPercentage}
              onChange={() => setShowPercentage(!showPercentage)}
            />
            Show Percentage
          </label>
        </div>

        <div className="control-group">
          <label>
            Color:
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="progress-container">
        <ProgressIndicator
          progress={progress}
          message={getMessage()}
          isVisible={true}
          variant={variant}
          size={size}
          showPercentage={showPercentage}
          color={color}
          testId="example-progress"
        />
      </div>

      <div className="action-buttons">
        <button onClick={handleToggleRunning}>
          {progress >= 100 ? 'Restart' : isRunning ? 'Pause' : 'Start'}
        </button>
        <button onClick={handleReset} disabled={progress === 0}>
          Reset
        </button>
      </div>
    </div>
  );
};

export default ProgressIndicatorExample;