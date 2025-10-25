import axios from 'axios';
import { DatasetInfo } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export const uploadFile = async (file: File): Promise<DatasetInfo> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return {
    id: Date.now().toString(),
    name: file.name,
    ...response.data,
  };
};

export const getMockData = async (): Promise<DatasetInfo> => {
  const response = await axios.get(`${API_BASE_URL}/api/mock-data`);
  return {
    id: 'mock-data',
    name: 'Mock Data',
    ...response.data,
  };
};
