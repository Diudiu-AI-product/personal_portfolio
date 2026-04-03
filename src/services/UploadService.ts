/**
 * 模拟文件上传服务
 * 为Figma原型图上传提供模拟上传功能，便于前端开发和测试
 */

import type { PrototypeImage } from '../data/projects';
import type { UploadTask, FileValidationConfig, UploadServiceConfig } from '../types/prototype';
import { UploadStatus, FileValidationError, generateUUID, validateFileType, validateFileSize, formatFileSize } from '../types/prototype';

export class UploadService {
  private config: UploadServiceConfig;
  private validationConfig: FileValidationConfig;
  private activeUploads: Map<string, UploadTask> = new Map();
  private uploadCallbacks: Map<string, (task: UploadTask) => void> = new Map();
  private objectURLs: Map<string, string> = new Map(); // 存储生成的对象URL

  constructor(
    config: Partial<UploadServiceConfig> = {},
    validationConfig: Partial<FileValidationConfig> = {}
  ) {
    this.config = {
      apiEndpoint: '/api/projects',
      simulate: true,
      simulationDelay: 1000,
      maxConcurrentUploads: 3,
      ...config,
    };

    this.validationConfig = {
      allowedTypes: ['image/png', 'image/jpeg', 'image/jpg'],
      maxSize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
      ...validationConfig,
    };
  }

  /**
   * 验证文件
   */
  validateFile(file: File): { valid: boolean; error?: FileValidationError; message?: string } {
    // 验证文件类型
    if (!validateFileType(file, this.validationConfig.allowedTypes)) {
      return {
        valid: false,
        error: FileValidationError.INVALID_TYPE,
        message: `文件类型不支持。支持的类型: ${this.validationConfig.allowedTypes.join(', ')}`,
      };
    }

    // 验证文件大小
    if (!validateFileSize(file, this.validationConfig.maxSize)) {
      return {
        valid: false,
        error: FileValidationError.EXCEEDS_SIZE,
        message: `文件大小超过限制。最大: ${formatFileSize(this.validationConfig.maxSize)}`,
      };
    }

    return { valid: true };
  }

  /**
   * 验证多个文件
   */
  validateFiles(files: File[]): { valid: boolean; errors: Array<{ file: File; error: FileValidationError; message: string }> } {
    const errors: Array<{ file: File; error: FileValidationError; message: string }> = [];

    // 验证文件数量
    if (files.length > this.validationConfig.maxFiles) {
      errors.push({
        file: files[0],
        error: FileValidationError.EXCEEDS_COUNT,
        message: `文件数量超过限制。最多: ${this.validationConfig.maxFiles} 个文件`,
      });
      return { valid: false, errors };
    }

    // 验证每个文件
    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        errors.push({
          file,
          error: validation.error!,
          message: validation.message!,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 为文件生成模拟的PrototypeImage对象
   */
  private generateMockPrototypeImage(file: File, order: number): PrototypeImage {
    const imageId = generateUUID();
    const originalName = file.name;

    // 生成对象URL用于图片显示
    const objectURL = URL.createObjectURL(file);
    this.objectURLs.set(imageId, objectURL);

    return {
      id: imageId,
      url: objectURL,
      thumbnailUrl: objectURL, // 使用相同URL，前端组件会调整显示尺寸
      previewUrl: objectURL,
      originalName,
      size: file.size,
      mimeType: file.type,
      uploadOrder: order,
    };
  }

  /**
   * 模拟上传单个文件
   */
  private async simulateFileUpload(
    taskId: string,
    file: File,
    order: number,
    onProgress?: (progress: number) => void
  ): Promise<PrototypeImage> {
    return new Promise((resolve, _reject) => {
      let progress = 0;
      const totalSteps = 3; // 验证、上传、处理
      const stepDuration = this.config.simulationDelay / totalSteps;

      // 更新任务状态
      this.updateTaskStatus(taskId, UploadStatus.UPLOADING, 0);

      // 模拟上传过程
      const simulateStep = (step: number) => {
        setTimeout(() => {
          progress = Math.min(100, (step / totalSteps) * 100);

          if (onProgress) {
            onProgress(progress);
          }

          this.updateTaskStatus(taskId, UploadStatus.UPLOADING, progress);

          if (step === 1) {
            this.updateTaskStatus(taskId, UploadStatus.PROCESSING, progress);
          }

          if (step < totalSteps) {
            simulateStep(step + 1);
          } else {
            // 上传完成
            const result = this.generateMockPrototypeImage(file, order);
            this.updateTaskStatus(taskId, UploadStatus.COMPLETED, 100, result);
            resolve(result);
          }
        }, stepDuration);
      };

      // 开始模拟
      simulateStep(1);
    });
  }

  /**
   * 上传单个文件
   */
  async uploadFile(
    file: File,
    order: number = 0,
    onProgress?: (progress: number) => void
  ): Promise<PrototypeImage> {
    const taskId = generateUUID();

    // 验证文件
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // 创建上传任务
    const task: UploadTask = {
      id: taskId,
      file,
      status: UploadStatus.PENDING,
      progress: 0,
    };

    this.activeUploads.set(taskId, task);

    try {
      if (this.config.simulate) {
        return await this.simulateFileUpload(taskId, file, order, onProgress);
      } else {
        // 真实上传逻辑（待实现）
        throw new Error('真实上传功能尚未实现，请启用模拟模式');
      }
    } catch (error) {
      this.updateTaskStatus(taskId, UploadStatus.ERROR, 0, undefined, error instanceof Error ? error.message : '上传失败');
      throw error;
    }
  }

  /**
   * 批量上传文件
   */
  async uploadFiles(
    files: File[],
    onTaskUpdate?: (task: UploadTask) => void
  ): Promise<PrototypeImage[]> {
    // 验证所有文件
    const validation = this.validateFiles(files);
    if (!validation.valid) {
      const errorMessages = validation.errors.map(e => `${e.file.name}: ${e.message}`).join('\n');
      throw new Error(`文件验证失败:\n${errorMessages}`);
    }

    const results: PrototypeImage[] = [];
    const maxConcurrent = this.config.maxConcurrentUploads;

    // 分组上传，控制并发数
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      const batchPromises = batch.map((file, index) => {
        const order = i + index;
        return this.uploadFile(file, order, (progress) => {
          // 更新进度回调
          const taskId = Array.from(this.activeUploads.keys()).find(key => {
            const task = this.activeUploads.get(key);
            return task?.file === file;
          });

          if (taskId && onTaskUpdate) {
            const task = this.activeUploads.get(taskId);
            if (task) {
              onTaskUpdate({ ...task, progress });
            }
          }
        });
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results.sort((a, b) => a.uploadOrder - b.uploadOrder);
  }

  /**
   * 取消上传
   */
  cancelUpload(taskId: string): boolean {
    const task = this.activeUploads.get(taskId);
    if (task && (task.status === UploadStatus.PENDING || task.status === UploadStatus.UPLOADING)) {
      this.updateTaskStatus(taskId, UploadStatus.CANCELLED, task.progress);
      return true;
    }
    return false;
  }

  /**
   * 获取上传任务状态
   */
  getTaskStatus(taskId: string): UploadTask | undefined {
    return this.activeUploads.get(taskId);
  }

  /**
   * 获取所有活动任务
   */
  getAllTasks(): UploadTask[] {
    return Array.from(this.activeUploads.values());
  }

  /**
   * 清除已完成的任务
   */
  clearCompletedTasks(): void {
    for (const [taskId, task] of this.activeUploads.entries()) {
      if (
        task.status === UploadStatus.COMPLETED ||
        task.status === UploadStatus.ERROR ||
        task.status === UploadStatus.CANCELLED
      ) {
        this.activeUploads.delete(taskId);
        this.uploadCallbacks.delete(taskId);
      }
    }
  }

  /**
   * 更新任务状态（内部方法）
   */
  private updateTaskStatus(
    taskId: string,
    status: UploadStatus,
    progress: number,
    result?: PrototypeImage,
    errorMessage?: string
  ): void {
    const task = this.activeUploads.get(taskId);
    if (!task) return;

    task.status = status;
    task.progress = progress;

    if (result) {
      task.result = result;
    }

    if (errorMessage) {
      task.errorMessage = errorMessage;
    }

    // 调用回调函数
    const callback = this.uploadCallbacks.get(taskId);
    if (callback) {
      callback(task);
    }

    // 如果任务完成，稍后自动清理
    if (
      status === UploadStatus.COMPLETED ||
      status === UploadStatus.ERROR ||
      status === UploadStatus.CANCELLED
    ) {
      setTimeout(() => {
        this.activeUploads.delete(taskId);
        this.uploadCallbacks.delete(taskId);
      }, 5000); // 5秒后清理
    }
  }

  /**
   * 注册任务更新回调
   */
  onTaskUpdate(taskId: string, callback: (task: UploadTask) => void): void {
    this.uploadCallbacks.set(taskId, callback);
  }

  /**
   * 移除任务更新回调
   */
  removeTaskUpdateCallback(taskId: string): void {
    this.uploadCallbacks.delete(taskId);
  }

  /**
   * 清理对象URL
   */
  revokeObjectURLs(imageIds: string[]): void {
    imageIds.forEach(id => {
      const url = this.objectURLs.get(id);
      if (url) {
        URL.revokeObjectURL(url);
        this.objectURLs.delete(id);
      }
    });
  }

  /**
   * 清理所有对象URL
   */
  revokeAllObjectURLs(): void {
    for (const url of this.objectURLs.values()) {
      URL.revokeObjectURL(url);
    }
    this.objectURLs.clear();
  }
}

// 导出默认实例
export const uploadService = new UploadService();

// 导出枚举值
export { UploadStatus, FileValidationError };
// 导出类型
export type { UploadTask };