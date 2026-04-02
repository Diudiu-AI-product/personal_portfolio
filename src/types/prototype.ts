/**
 * Figma原型图上传系统类型定义
 */

import type { PrototypeImage } from '../data/projects';

/**
 * 上传状态常量
 */
export const UploadStatus = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
  CANCELLED: 'cancelled',
} as const;

export type UploadStatus = typeof UploadStatus[keyof typeof UploadStatus];

/**
 * 文件验证错误常量
 */
export const FileValidationError = {
  INVALID_TYPE: 'invalid_type',
  EXCEEDS_SIZE: 'exceeds_size',
  EXCEEDS_COUNT: 'exceeds_count',
  INVALID_DIMENSIONS: 'invalid_dimensions',
  UNKNOWN: 'unknown',
} as const;

export type FileValidationError = typeof FileValidationError[keyof typeof FileValidationError];

/**
 * 上传任务接口
 */
export interface UploadTask {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number; // 0-100
  error?: FileValidationError;
  errorMessage?: string;
  result?: PrototypeImage;
}

/**
 * 文件验证配置
 */
export interface FileValidationConfig {
  allowedTypes: string[];
  maxSize: number; // bytes
  maxFiles: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * 上传服务配置
 */
export interface UploadServiceConfig {
  apiEndpoint: string;
  apiKey?: string;
  simulate: boolean; // 是否模拟上传
  simulationDelay: number; // 模拟延迟(ms)
  maxConcurrentUploads: number;
}

/**
 * 画廊状态接口
 */
export interface GalleryState {
  currentIndex: number;
  isOpen: boolean;
  images: PrototypeImage[];
  zoomLevel: number;
}

/**
 * 默认文件验证配置
 */
export const DEFAULT_VALIDATION_CONFIG: FileValidationConfig = {
  allowedTypes: ['image/png', 'image/jpeg', 'image/jpg'],
  maxSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,
};

/**
 * 默认上传服务配置
 */
export const DEFAULT_UPLOAD_CONFIG: UploadServiceConfig = {
  apiEndpoint: '/api/projects',
  simulate: true,
  simulationDelay: 1000,
  maxConcurrentUploads: 3,
};

/**
 * 生成模拟图片URL
 */
export function generateMockImageUrl(filename: string, type: 'original' | 'thumbnail' | 'preview' = 'original'): string {
  const baseUrl = 'https://mock.cdn.example.com';
  const size = type === 'thumbnail' ? '200x200' : type === 'preview' ? '800x600' : 'original';
  return `${baseUrl}/${type}/${size}/${filename}-${Date.now()}.jpg`;
}

/**
 * 生成UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 验证文件类型
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}