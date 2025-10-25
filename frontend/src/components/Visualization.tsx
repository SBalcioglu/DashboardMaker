import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DataRecord, VisualizationConfig, DatasetInfo } from '../types';
import { Button } from './Button';
import './Visualization.css';

interface VisualizationProps {
  config: VisualizationConfig;
  data: DataRecord[];
  columns: string[];
  datasetName: string;
  datasets: DatasetInfo[];
  onRemove: () => void;
  onConfigChange: (config: VisualizationConfig) => void;
}

const COLORS = ['#4a9eff', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];
const MAX_DATA_POINTS = 500;

export const Visualization: React.FC<VisualizationProps> = ({
  config,
  data,
  columns,
  datasets,
  onRemove,
  onConfigChange,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tempConfig, setTempConfig] = useState(config);

  // Sync tempConfig with config when it changes
  useEffect(() => {
    setTempConfig(config);
  }, [config]);

  const numericColumns = useMemo(() => {
    return columns.filter((col) => {
      if (data.length === 0) return false;
      return typeof data[0][col] === 'number';
    });
  }, [columns, data]);

  const processedData = useMemo(() => {
    // Early return if no axes configured
    if (!config.xAxis || !config.yAxis || config.yAxis.length === 0) {
      return data.length > MAX_DATA_POINTS
        ? data.filter((_, index) => index % Math.ceil(data.length / MAX_DATA_POINTS) === 0)
        : data;
    }

    const enabledCols = config.enabledColumns && config.enabledColumns.length > 0
      ? config.enabledColumns
      : columns;

    // Calculate sampling step
    const needsSampling = data.length > MAX_DATA_POINTS;
    const step = needsSampling ? Math.ceil(data.length / MAX_DATA_POINTS) : 1;

    // Check if we need aggregation (non-numeric X-axis)
    const needsAggregation = !numericColumns.includes(config.xAxis);

    if (!needsAggregation) {
      // Simple case: numeric X-axis, just filter columns and sample
      const result: DataRecord[] = [];
      for (let i = 0; i < data.length; i += step) {
        const row = data[i];
        const filtered: DataRecord = {};
        enabledCols.forEach(col => {
          if (row.hasOwnProperty(col)) {
            filtered[col] = row[col];
          }
        });
        result.push(filtered);
      }
      return result;
    }

    // Complex case: categorical X-axis, need to aggregate
    const groupedData: { [key: string]: {
      xValue: string;
      sums: { [col: string]: number };
      counts: { [col: string]: number };
    }} = {};

    // Single pass: filter columns, sample, and aggregate
    for (let i = 0; i < data.length; i += step) {
      const row = data[i];
      const key = String(row[config.xAxis]);

      if (!groupedData[key]) {
        groupedData[key] = {
          xValue: key,
          sums: {},
          counts: {}
        };
        config.yAxis.forEach(yCol => {
          groupedData[key].sums[yCol] = 0;
          groupedData[key].counts[yCol] = 0;
        });
      }

      config.yAxis.forEach(yCol => {
        const value = row[yCol];
        if (typeof value === 'number') {
          groupedData[key].sums[yCol] += value;
        }
        groupedData[key].counts[yCol]++;
      });
    }

    // Convert to final format
    return Object.values(groupedData).map(group => {
      const result: DataRecord = { [config.xAxis!]: group.xValue };
      config.yAxis!.forEach(yCol => {
        const sum = group.sums[yCol];
        const count = group.counts[yCol];
        // For numeric columns, calculate average; for non-numeric, show count
        result[yCol] = sum > 0 ? sum / count : count;
      });
      return result;
    });
  }, [data, columns, config.xAxis, config.yAxis, config.enabledColumns, numericColumns]);

  const applySettings = () => {
    onConfigChange(tempConfig);
    setShowSettings(false);
    setShowFilters(false);
  };

  const toggleColumn = (column: string) => {
    const current = tempConfig.enabledColumns || columns;
    const newEnabled = current.includes(column)
      ? current.filter(c => c !== column)
      : [...current, column];
    setTempConfig({ ...tempConfig, enabledColumns: newEnabled });
  };

  const selectAllColumns = () => {
    setTempConfig({ ...tempConfig, enabledColumns: columns });
  };

  const unselectAllColumns = () => {
    setTempConfig({ ...tempConfig, enabledColumns: [] });
  };

  const renderChart = () => {
    if (!config.xAxis || !config.yAxis || config.yAxis.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>Click settings to configure axes</p>
        </div>
      );
    }

    // Filter Y-axis columns based on enabled columns
    const activeYAxis = config.yAxis.filter(yCol =>
      (config.enabledColumns || columns).includes(yCol)
    );

    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 60, bottom: 20 },
    };

    if (activeYAxis.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>No columns selected for display</p>
        </div>
      );
    }

    switch (config.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey={config.xAxis}
                stroke="var(--text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                }}
              />
              <Legend />
              {activeYAxis.map((yKey, idx) => (
                <Line
                  key={yKey}
                  type="monotone"
                  dataKey={yKey}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={processedData.length < 50}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey={config.xAxis}
                stroke="var(--text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                }}
              />
              <Legend />
              {activeYAxis.map((yKey, idx) => (
                <Bar
                  key={yKey}
                  dataKey={yKey}
                  fill={COLORS[idx % COLORS.length]}
                  activeBar={{ fill: COLORS[idx % COLORS.length], opacity: 0.7 }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey={config.xAxis}
                stroke="var(--text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                }}
              />
              <Legend />
              {activeYAxis.map((yKey, idx) => (
                <Area
                  key={yKey}
                  type="monotone"
                  dataKey={yKey}
                  stroke={COLORS[idx % COLORS.length]}
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = processedData.slice(0, 20).map((item) => ({
          name: String(item[config.xAxis!]),
          value: Number(item[activeYAxis[0]]),
        }));

        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={100}
                dataKey="value"
              >
                {pieData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey={config.xAxis}
                stroke="var(--text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                dataKey={activeYAxis[0]}
                stroke="var(--text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                }}
              />
              <Legend />
              <Scatter
                name={activeYAxis[0]}
                data={processedData}
                fill={COLORS[0]}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="visualization-card">
      <div className="visualization-header">
        <div className="viz-drag-handle" title="Drag to move">
          ⠿
        </div>
        <div className="viz-title">
          <select
            className="chart-type-select"
            value={config.type}
            onChange={(e) =>
              onConfigChange({
                ...config,
                type: e.target.value as VisualizationConfig['type'],
              })
            }
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="area">Area Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="scatter">Scatter Plot</option>
          </select>
          <select
            className="dataset-select-viz"
            value={config.datasetId}
            onChange={(e) => {
              const newDataset = datasets.find(d => d.id === e.target.value);
              if (newDataset) {
                // Auto-configure axes based on data types
                const numericColumns = newDataset.columns.filter((col) => {
                  if (newDataset.data.length === 0) return false;
                  return typeof newDataset.data[0][col] === 'number';
                });

                onConfigChange({
                  ...config,
                  datasetId: e.target.value,
                  xAxis: newDataset.columns[0],
                  yAxis: numericColumns.length > 0 ? [numericColumns[0]] : [newDataset.columns[0]],
                  enabledColumns: newDataset.columns,
                });
              }
            }}
            title="Select dataset"
          >
            {datasets.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name}
              </option>
            ))}
          </select>
        </div>

        <div className="visualization-controls">
          <button
            className="icon-btn"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setShowSettings(!showSettings);
              setShowFilters(false);
            }}
            title="Settings"
          >
            ⚙
          </button>
          <button
            className="icon-btn"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setShowFilters(!showFilters);
              setShowSettings(false);
            }}
            title="Filter Columns"
          >
            ⚡
          </button>
          <button
            className="icon-btn danger"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Remove"
          >
            ×
          </button>
        </div>
      </div>

      {data.length > MAX_DATA_POINTS && (
        <div className="data-notice">
          Showing {processedData.length} of {data.length} data points for performance
        </div>
      )}

      {showSettings && (
        <div className="visualization-settings">
          <div className="setting-group">
            <label>X-Axis</label>
            <select
              value={tempConfig.xAxis || ''}
              onChange={(e) =>
                setTempConfig({ ...tempConfig, xAxis: e.target.value })
              }
            >
              <option value="">Select column</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label>Y-Axis</label>
            <div className="checkbox-group">
              {columns.map((col) => (
                <label key={col} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={tempConfig.yAxis?.includes(col) || false}
                    onChange={(e) => {
                      const currentY = tempConfig.yAxis || [];
                      const newY = e.target.checked
                        ? [...currentY, col]
                        : currentY.filter((y) => y !== col);
                      setTempConfig({ ...tempConfig, yAxis: newY });
                    }}
                  />
                  {col} {numericColumns.includes(col) ? '(numeric)' : '(count)'}
                </label>
              ))}
            </div>
          </div>

          <Button
            onClick={() => {
              applySettings();
            }}
            fullWidth
          >
            Apply
          </Button>
        </div>
      )}

      {showFilters && (
        <div className="visualization-settings">
          <div className="filter-header">
            <h4>Select Columns to Display</h4>
            <div className="filter-actions">
              <button
                className="filter-action-btn"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  selectAllColumns();
                }}
              >
                Select All
              </button>
              <button
                className="filter-action-btn"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  unselectAllColumns();
                }}
              >
                Unselect All
              </button>
            </div>
          </div>

          <div className="checkbox-group">
            {columns.map((col) => (
              <label key={col} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={(tempConfig.enabledColumns || columns).includes(col)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    e.stopPropagation();
                    toggleColumn(col);
                  }}
                />
                {col}
              </label>
            ))}
          </div>

          <Button
            onClick={() => {
              applySettings();
            }}
            fullWidth
          >
            Apply Filter
          </Button>
        </div>
      )}

      <div className="visualization-content">{renderChart()}</div>
    </div>
  );
};
