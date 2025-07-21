import React, { useState, useEffect } from 'react';
import { performanceMetrics } from '../utils/performanceUtils';
import './PerformanceMonitor.css';

interface PerformanceMonitorProps {
  /** Whether the monitor is visible */
  visible?: boolean;
  /** Update interval in milliseconds */
  updateInterval?: number;
}

/**
 * Component for monitoring and displaying application performance metrics
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  visible = false,
  updateInterval = 2000
}) => {
  const [metrics, setMetrics] = useState<Record<string, { count: number, average: number, min: number, max: number }>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  // Update metrics periodically
  useEffect(() => {
    if (!visible) return;

    const intervalId = setInterval(() => {
      setMetrics(performanceMetrics.getReport());
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [visible, updateInterval]);

  if (!visible) return null;

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className={`performance-monitor ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="performance-monitor-header" onClick={toggleExpand}>
        <h3>性能监控</h3>
        <span className="toggle-icon">{isExpanded ? '▼' : '▲'}</span>
      </div>

      {isExpanded && (
        <div className="performance-monitor-content">
          {Object.keys(metrics).length === 0 ? (
            <p className="no-metrics">暂无性能数据</p>
          ) : (
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>操作</th>
                  <th>次数</th>
                  <th>平均 (ms)</th>
                  <th>最小 (ms)</th>
                  <th>最大 (ms)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics).map(([name, data]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{data.count}</td>
                    <td>{data.average.toFixed(2)}</td>
                    <td>{data.min.toFixed(2)}</td>
                    <td>{data.max.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="performance-monitor-actions">
            <button
              className="clear-metrics-button"
              onClick={() => {
                performanceMetrics.clear();
                setMetrics({});
              }}
            >
              清除数据
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;