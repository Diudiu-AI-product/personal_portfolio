import React, { useState, useEffect, useCallback } from 'react';
import type { PrototypeImage } from '../data/projects';

interface ImageGalleryModalProps {
  images: PrototypeImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const currentImage = images[currentIndex];

  // 键盘导航
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNext();
        break;
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
        e.preventDefault();
        zoomOut();
        break;
      case '0':
        e.preventDefault();
        resetZoom();
        break;
    }
  }, [isOpen, onClose]);

  // 点击外部关闭
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // 导航函数
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
    resetZoom();
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
    resetZoom();
  }, [images.length]);

  // 缩放函数
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  // 图片拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
  }, [zoomLevel, imagePosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    e.preventDefault();
    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, zoomLevel, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 效果
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown, handleMouseMove, handleMouseUp]);

  // 重置状态当模态框关闭或图片变化
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(initialIndex);
      resetZoom();
    }
  }, [isOpen, initialIndex, resetZoom]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm transition-opacity duration-300"
      onClick={handleBackdropClick}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 text-white hover:text-purple-300 text-3xl transition-colors"
        aria-label="关闭画廊"
      >
        ×
      </button>

      {/* 标题 */}
      {title && (
        <div className="absolute top-6 left-6 z-10 text-white text-lg font-medium">
          {title}
        </div>
      )}

      {/* 图片计数器 */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>

      {/* 导航按钮 */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-purple-300 bg-black/50 p-3 rounded-full transition-colors"
            aria-label="上一张图片"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-purple-300 bg-black/50 p-3 rounded-full transition-colors"
            aria-label="下一张图片"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* 主图片容器 */}
      <div className="relative w-full max-w-6xl h-full max-h-[90vh] flex items-center justify-center">
        <div
          className={`relative w-full h-full flex items-center justify-center ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseDown={handleMouseDown}
        >
          <img
            src={currentImage.previewUrl || currentImage.url}
            alt={`图片 ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
            }}
            draggable="false"
          />

          {/* 加载状态 */}
          {!currentImage.previewUrl && !currentImage.url && (
            <div className="text-white text-lg">加载中...</div>
          )}
        </div>

        {/* 缩放指示器 */}
        {zoomLevel !== 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/70 px-3 py-1 rounded-full">
            缩放: {Math.round(zoomLevel * 100)}%
          </div>
        )}
      </div>

      {/* 控制栏 */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
        {/* 缩放控制 */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={zoomLevel <= 0.5}
            className="text-white hover:text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed p-1"
            aria-label="缩小"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={resetZoom}
            className="text-white hover:text-purple-300 text-sm px-2"
            aria-label="重置缩放"
          >
            重置
          </button>
          <button
            onClick={zoomIn}
            disabled={zoomLevel >= 3}
            className="text-white hover:text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed p-1"
            aria-label="放大"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>

        {/* 下载按钮 */}
        <a
          href={currentImage.url}
          download={currentImage.originalName}
          className="text-white hover:text-purple-300 p-1"
          aria-label="下载图片"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>

        {/* 图片信息 */}
        <div className="text-white text-sm ml-2 border-l border-gray-600 pl-3">
          {currentImage.originalName} • {Math.round(currentImage.size / 1024)} KB
        </div>
      </div>

      {/* 缩略图导航 */}
      {images.length > 1 && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 py-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => {
                setCurrentIndex(index);
                resetZoom();
              }}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-purple-500 scale-110'
                  : 'border-transparent hover:border-gray-500'
              }`}
              aria-label={`查看图片 ${index + 1}`}
            >
              <img
                src={image.thumbnailUrl || image.url}
                alt={`缩略图 ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* 键盘快捷键提示 */}
      <div className="absolute bottom-4 right-4 text-gray-400 text-xs">
        ← → 导航 • ESC 关闭 • +/- 缩放
      </div>
    </div>
  );
};

export default ImageGalleryModal;