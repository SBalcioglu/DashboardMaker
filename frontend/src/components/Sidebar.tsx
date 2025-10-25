import React, { useRef } from 'react';
import { Button } from './Button';
import { DatasetInfo } from '../types';
import './Sidebar.css';

interface SidebarProps {
  onFileUpload: (files: File[]) => void;
  onMockDataLoad: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  datasets: DatasetInfo[];
  onDeleteDataset: (datasetId: string) => void;
  selectedDatasetId: string | null;
  onSelectDataset: (datasetId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onFileUpload,
  onMockDataLoad,
  darkMode,
  onToggleTheme,
  datasets,
  onDeleteDataset,
  selectedDatasetId,
  onSelectDataset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(Array.from(files));
    }
    // Reset the input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h2>Dashboard</h2>
        </div>

        <div className="sidebar-section">
          <h3>Data Import</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.xml,.json"
            onChange={handleFileChange}
            multiple
            style={{ display: 'none' }}
          />
          <Button onClick={handleImportClick} fullWidth>
            Import Files
          </Button>
          <Button onClick={onMockDataLoad} variant="secondary" fullWidth>
            Load Mock Data
          </Button>
        </div>

        {datasets.length > 0 && (
          <div className="sidebar-section">
            <h3>Imported Datasets</h3>
            <div className="dataset-list">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className={`dataset-item ${selectedDatasetId === dataset.id ? 'selected' : ''}`}
                >
                  <div
                    className="dataset-info"
                    onClick={() => onSelectDataset(dataset.id)}
                    title={`${dataset.shape.rows} rows × ${dataset.shape.columns} columns`}
                  >
                    <div className="dataset-name">{dataset.name}</div>
                    <div className="dataset-meta">
                      {dataset.shape.rows} rows × {dataset.shape.columns} cols
                    </div>
                  </div>
                  <button
                    className="dataset-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete dataset "${dataset.name}"? This will also remove all visualizations using this dataset.`)) {
                        onDeleteDataset(dataset.id);
                      }
                    }}
                    title="Delete dataset"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button
          className="theme-toggle-sidebar"
          onClick={onToggleTheme}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '☀' : '☾'}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </div>
  );
};
