import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { UploadTask } from '../services/UploadService';
import { UploadStatus, uploadService } from '../services/UploadService';
import { formatFileSize } from '../types/prototype';

import type { PrototypeImage } from '../data/projects';

interface FileUploaderProps {
  onFilesSelected?: (files: File[]) => void;
  onUploadComplete?: (images: PrototypeImage[]) => void;
  maxFiles?: number;
  maxSize?: number; // bytes
  allowedTypes?: string[];
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  onUploadComplete,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'],
  disabled = false,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Array<{ file: File; message: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 验证文件
  const validateFile = useCallback((file: File): { valid: boolean; message?: string } => {
    // 验证文件类型
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: `文件类型不支持。支持的类型: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`,
      };
    }

    // 验证文件大小
    if (file.size > maxSize) {
      return {
        valid: false,
        message: `文件大小超过限制。最大: ${formatFileSize(maxSize)}`,
      };
    }

    // 验证文件数量
    if (files.length >= maxFiles) {
      return {
        valid: false,
        message: `文件数量超过限制。最多: ${maxFiles} 个文件`,
      };
    }

    return { valid: true };
  }, [allowedTypes, maxSize, maxFiles, files.length]);

  // 处理文件选择
  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const newFiles: File[] = [];
    const newErrors: Array<{ file: File; message: string }> = [];

    Array.from(selectedFiles).forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        newFiles.push(file);
      } else {
        newErrors.push({ file, message: validation.message! });
      }
    });

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
      setFiles(updatedFiles);
      if (onFilesSelected) {
        onFilesSelected(updatedFiles);
      }
    }

    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors]);
      // 3秒后清除错误
      setTimeout(() => {
        setErrors(prev => prev.filter(e => !newErrors.includes(e)));
      }, 3000);
    }
  }, [files, maxFiles, validateFile, onFilesSelected]);

  // 拖拽事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [disabled, handleFileSelect]);

  // 点击上传区域
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // 文件输入变化
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
      // 重置input，允许选择相同文件
      e.target.value = '';
    }
  }, [handleFileSelect]);

  // 移除文件
  const handleRemoveFile = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    if (onFilesSelected) {
      onFilesSelected(updatedFiles);
    }
  }, [files, onFilesSelected]);

  // 开始上传
  const handleUpload = useCallback(async () => {
    if (files.length === 0 || isUploading) return;

    console.log('FileUploader: handleUpload called with files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    setIsUploading(true);
    setErrors([]);

    try {
      const results = await uploadService.uploadFiles(files, (task) => {
        // 更新任务状态
        setUploadTasks(prev => {
          const index = prev.findIndex(t => t.id === task.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = task;
            return updated;
          } else {
            return [...prev, task];
          }
        });
      });

      console.log('FileUploader: upload completed with results:', results);
      if (onUploadComplete) {
        onUploadComplete(results);
      }

      // 上传完成后清空文件列表
      setFiles([]);
      setUploadTasks([]);
    } catch (error) {
      console.error('FileUploader: upload failed:', error);
      setErrors([{ file: files[0], message: error instanceof Error ? error.message : '上传失败' }]);
    } finally {
      setIsUploading(false);
    }
  }, [files, isUploading, onUploadComplete]);

  // 清除错误
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // 获取文件预览URL
  const getFilePreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  // 清理对象URL
  useEffect(() => {
    return () => {
      files.forEach(file => {
        URL.revokeObjectURL(getFilePreviewUrl(file));
      });
    };
  }, [files]);

  // 计算总进度
  const totalProgress = uploadTasks.length > 0
    ? Math.round(uploadTasks.reduce((sum, task) => sum + task.progress, 0) / uploadTasks.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* 拖拽上传区域 */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragging
            ? 'border-purple-500 bg-purple-900/20'
            : 'border-gray-700 hover:border-purple-500 hover:bg-purple-900/10'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-4">
          <div className="text-5xl text-gray-400">📁</div>
          <div>
            <p className="text-white font-medium text-lg">
              拖拽文件到此处或点击选择
            </p>
            <p className="text-gray-400 text-sm mt-2">
              支持 {allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} 格式，
              单个文件不超过 {formatFileSize(maxSize)}，最多 {maxFiles} 个文件
            </p>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {errors.length > 0 && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-red-300 font-medium">上传错误</h4>
            <button
              onClick={clearErrors}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              清除
            </button>
          </div>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-red-300 text-sm">
                {error.file.name}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 文件预览列表 */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-white font-medium">已选择文件 ({files.length}/{maxFiles})</h4>
            <button
              onClick={() => setFiles([])}
              className="text-purple-400 hover:text-purple-300 text-sm"
              disabled={isUploading}
            >
              清空全部
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => {
              const task = uploadTasks.find(t => t.file === file);
              const progress = task?.progress || 0;
              const isUploaded = task?.status === UploadStatus.COMPLETED;

              return (
                <div
                  key={`${file.name}-${index}`}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${
                    isUploaded
                      ? 'border-green-700/50 bg-green-900/20'
                      : 'border-gray-700 bg-gray-900/50'
                  }`}
                >
                  {/* 文件预览 */}
                  {file.type.startsWith('image/') ? (
                    <div className="w-12 h-12 flex-shrink-0">
                      <img
                        src={getFilePreviewUrl(file)}
                        alt={file.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 flex-shrink-0 bg-gray-800 rounded flex items-center justify-center">
                      <span className="text-2xl">📄</span>
                    </div>
                  )}

                  {/* 文件信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white text-sm truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      {!isUploading && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(index);
                          }}
                          className="text-gray-400 hover:text-red-400 text-xl"
                          disabled={isUploading}
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* 上传进度条 */}
                    {isUploading && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>
                            {task?.status === UploadStatus.COMPLETED
                              ? '上传完成'
                              : task?.status === UploadStatus.PROCESSING
                              ? '处理中...'
                              : '上传中...'}
                          </span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 上传按钮和总进度 */}
      {(files.length > 0 || isUploading) && (
        <div className="space-y-3">
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">总进度</span>
                <span className="text-purple-300">{totalProgress}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading || disabled}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                files.length === 0 || isUploading || disabled
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
              }`}
            >
              {isUploading ? '上传中...' : `上传 ${files.length} 个文件`}
            </button>

            {isUploading && (
              <button
                onClick={() => {
                  uploadTasks.forEach(task => {
                    uploadService.cancelUpload(task.id);
                  });
                  setIsUploading(false);
                }}
                className="px-6 py-3 border border-red-600 text-red-300 rounded-lg font-medium hover:bg-red-900/30 transition-colors"
              >
                取消上传
              </button>
            )}
          </div>
        </div>
      )}

      {/* 帮助文本 */}
      {files.length === 0 && !isUploading && (
        <div className="text-gray-500 text-sm text-center">
          支持批量上传，可拖拽调整文件顺序（上传前）
        </div>
      )}
    </div>
  );
};

export default FileUploader;