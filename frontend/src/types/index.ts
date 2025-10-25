export interface DataRecord {
  [key: string]: string | number;
}

export interface DatasetInfo {
  id: string;
  name: string;
  columns: string[];
  data: DataRecord[];
  shape: {
    rows: number;
    columns: number;
  };
}

export interface VisualizationConfig {
  id: string;
  datasetId: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'scatter';
  xAxis?: string;
  yAxis?: string[];
  enabledColumns?: string[];
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}
