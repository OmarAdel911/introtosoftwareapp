import { api } from './api';

export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  createdAt: string;
  category?: string;
  tags?: string[];
}

export interface UploadConfig {
  category?: string;
  tags?: string[];
  maxSize?: number;
  allowedTypes?: string[];
}

export const fileUploadApi = {
  async uploadFile(file: File, config: UploadConfig = {}): Promise<FileMetadata> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (config.category) {
      formData.append('category', config.category);
    }
    if (config.tags) {
      formData.append('tags', JSON.stringify(config.tags));
    }

    const { data } = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async getFiles(category?: string): Promise<FileMetadata[]> {
    const { data } = await api.get('/files', {
      params: { category },
    });
    return data;
  },

  async getFileById(fileId: string): Promise<FileMetadata> {
    const { data } = await api.get(`/files/${fileId}`);
    return data;
  },

  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`/files/${fileId}`);
  },

  async updateFileMetadata(
    fileId: string,
    metadata: Partial<Pick<FileMetadata, 'tags' | 'category'>>
  ): Promise<FileMetadata> {
    const { data } = await api.patch(`/files/${fileId}`, metadata);
    return data;
  },

  async getUploadConfig(): Promise<UploadConfig> {
    const { data } = await api.get('/files/config');
    return data;
  },

  getFileUrl(fileId: string): string {
    return `${api.defaults.baseURL}/files/${fileId}/download`;
  }
}; 