import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Sidebar } from './components/Sidebar';
import { Visualization } from './components/Visualization';
import { Button } from './components/Button';
import { uploadFile, getMockData } from './services/api';
import { saveDataset, getAllDatasets, deleteDataset as deleteDatasetFromDB } from './services/db';
import { DatasetInfo, VisualizationConfig } from './types';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './App.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(() => {
    const saved = localStorage.getItem('selectedDatasetId');
    return saved || null;
  });
  const [visualizations, setVisualizations] = useState<VisualizationConfig[]>(() => {
    const saved = localStorage.getItem('visualizations');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load datasets from IndexedDB on mount
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const savedDatasets = await getAllDatasets();
        if (savedDatasets.length > 0) {
          setDatasets(savedDatasets);
        }
      } catch (err) {
        console.error('Failed to load datasets from IndexedDB:', err);
      }
    };
    loadDatasets();
  }, []);

  useEffect(() => {
    if (!darkMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    try {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem('selectedDatasetId', selectedDatasetId || '');
    } catch (err) {
      console.warn('Failed to save selected dataset:', err);
    }
  }, [selectedDatasetId]);

  useEffect(() => {
    try {
      localStorage.setItem('visualizations', JSON.stringify(visualizations));
    } catch (err) {
      console.warn('Failed to save visualizations:', err);
    }
  }, [visualizations]);

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId);

  const handleFileUpload = async (files: File[]) => {
    setLoading(true);
    setError(null);
    try {
      const newDatasets: DatasetInfo[] = [];
      const newVisualizations: VisualizationConfig[] = [];

      for (const file of files) {
        try {
          const data = await uploadFile(file);
          newDatasets.push(data);

          // Save to IndexedDB
          await saveDataset(data);

          const numericColumns = data.columns.filter((col) => {
            if (data.data.length === 0) return false;
            return typeof data.data[0][col] === 'number';
          });

          // Calculate next available position (3 per row)
          const existingVizCount = visualizations.length + newVisualizations.length;
          const col = (existingVizCount % 3) * 4; // 3 visualizations per row (4 cols each)
          const row = Math.floor(existingVizCount / 3) * 3; // Each viz is 3 rows tall

          newVisualizations.push({
            id: `${Date.now()}-${Math.random()}`,
            datasetId: data.id,
            type: 'bar',
            xAxis: data.columns[0],
            yAxis: numericColumns.length > 0 ? [numericColumns[0]] : [data.columns[0]],
            enabledColumns: data.columns,
            layout: { x: col, y: row, w: 4, h: 3 },
          });
        } catch (fileErr) {
          console.error(`Failed to upload ${file.name}:`, fileErr);
          setError(`Failed to upload ${file.name}: ${fileErr instanceof Error ? fileErr.message : 'Unknown error'}`);
        }
      }

      if (newDatasets.length > 0) {
        setDatasets([...datasets, ...newDatasets]);
        setSelectedDatasetId(newDatasets[newDatasets.length - 1].id);
        setVisualizations([...visualizations, ...newVisualizations]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setLoading(false);
    }
  };

  const handleMockDataLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMockData();
      const existingMock = datasets.find(d => d.id === 'mock-data');
      if (!existingMock) {
        setDatasets([...datasets, data]);
        // Save to IndexedDB
        await saveDataset(data);
      }
      setSelectedDatasetId(data.id);

      // Calculate next available position (3 per row)
      const existingVizCount = visualizations.length;
      const col = (existingVizCount % 3) * 4; // 3 visualizations per row (4 cols each)
      const row = Math.floor(existingVizCount / 3) * 3; // Each viz is 3 rows tall

      setVisualizations([
        ...visualizations,
        {
          id: Date.now().toString(),
          datasetId: data.id,
          type: 'line',
          xAxis: 'Month',
          yAxis: ['Sales'],
          enabledColumns: data.columns,
          layout: { x: col, y: row, w: 4, h: 3 },
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mock data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVisualization = () => {
    if (!selectedDataset) return;
    const numericColumns = selectedDataset.columns.filter((col) => {
      if (selectedDataset.data.length === 0) return false;
      return typeof selectedDataset.data[0][col] === 'number';
    });

    // Calculate next available position (3 per row)
    const existingVizCount = visualizations.length;
    const col = (existingVizCount % 3) * 4; // 3 visualizations per row (4 cols each)
    const row = Math.floor(existingVizCount / 3) * 3; // Each viz is 3 rows tall

    setVisualizations([
      ...visualizations,
      {
        id: Date.now().toString(),
        datasetId: selectedDataset.id,
        type: 'bar',
        xAxis: selectedDataset.columns[0],
        yAxis: numericColumns.length > 0 ? [numericColumns[0]] : [],
        enabledColumns: selectedDataset.columns,
        layout: { x: col, y: row, w: 4, h: 3 },
      },
    ]);
  };

  const handleRemoveVisualization = (id: string) => {
    setVisualizations(visualizations.filter((v) => v.id !== id));
  };

  const handleDeleteDataset = async (datasetId: string) => {
    try {
      // Remove from IndexedDB
      await deleteDatasetFromDB(datasetId);

      // Remove the dataset
      setDatasets(datasets.filter((d) => d.id !== datasetId));

      // Remove all visualizations using this dataset
      setVisualizations(visualizations.filter((v) => v.datasetId !== datasetId));

      // If this was the selected dataset, clear selection or select another
      if (selectedDatasetId === datasetId) {
        const remainingDatasets = datasets.filter((d) => d.id !== datasetId);
        setSelectedDatasetId(remainingDatasets.length > 0 ? remainingDatasets[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete dataset:', err);
      setError('Failed to delete dataset from storage');
    }
  };

  const handleVisualizationConfigChange = (config: VisualizationConfig) => {
    setVisualizations(
      visualizations.map((v) => (v.id === config.id ? config : v))
    );
  };

  const handleLayoutChange = (layout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => {
    const updatedVisualizations = visualizations.map((viz) => {
      const layoutItem = layout.find((item) => item.i === viz.id);
      if (layoutItem) {
        return {
          ...viz,
          layout: { x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h },
        };
      }
      return viz;
    });
    setVisualizations(updatedVisualizations);
  };

  const getDatasetForVisualization = (viz: VisualizationConfig): DatasetInfo | undefined => {
    return datasets.find(d => d.id === viz.datasetId);
  };

  return (
    <div className="app">
      <Sidebar
        onFileUpload={handleFileUpload}
        onMockDataLoad={handleMockDataLoad}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
        datasets={datasets}
        onDeleteDataset={handleDeleteDataset}
        selectedDatasetId={selectedDatasetId}
        onSelectDataset={setSelectedDatasetId}
      />

      <div className="main-content">

        {loading && (
          <div className="status-message">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        )}

        {error && (
          <div className="status-message error">
            <p>{error}</p>
          </div>
        )}

        {!loading && datasets.length === 0 && !error && (
          <div className="empty-state">
            <h2>Data Visualization Dashboard</h2>
            <p>Import a file or load mock data to begin</p>
          </div>
        )}

        {datasets.length > 0 && !loading && (
          <div className="dashboard-content">
            {selectedDataset && (
              <div className="data-preview">
                <h4>Data Preview: {selectedDataset.name}</h4>
                <div className="preview-stats">
                  <span>Rows: {selectedDataset.shape.rows}</span>
                  <span>Columns: {selectedDataset.shape.columns}</span>
                </div>
                <div className="preview-table-container">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {selectedDataset.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDataset.data.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          {selectedDataset.columns.map((col) => (
                            <td key={col}>{String(row[col])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="visualizations-section">
              <div className="visualizations-header">
                <h3>Visualizations</h3>
                <Button onClick={handleAddVisualization} disabled={!selectedDataset}>
                  Add Visualization
                </Button>
              </div>

            <ResponsiveGridLayout
              className="visualizations-grid"
              layouts={{
                lg: visualizations.map((viz) => ({
                  i: viz.id,
                  x: viz.layout?.x || 0,
                  y: viz.layout?.y || 0,
                  w: viz.layout?.w || 4,
                  h: viz.layout?.h || 3,
                }))
              }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={100}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".viz-drag-handle"
              draggableCancel=".visualization-controls, .visualization-settings, .icon-btn, .chart-type-select, .dataset-select-viz, .filter-action-btn, button, select, input, label"
              compactType="vertical"
              preventCollision={true}
              isResizable={true}
              resizeHandles={['se', 'sw', 'ne', 'nw']}
            >
              {visualizations.map((viz) => {
                const dataset = getDatasetForVisualization(viz);
                if (!dataset) return null;

                return (
                  <div key={viz.id}>
                    <Visualization
                      config={viz}
                      data={dataset.data}
                      columns={dataset.columns}
                      datasetName={dataset.name}
                      datasets={datasets}
                      onRemove={() => handleRemoveVisualization(viz.id)}
                      onConfigChange={handleVisualizationConfigChange}
                    />
                  </div>
                );
              })}
            </ResponsiveGridLayout>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
