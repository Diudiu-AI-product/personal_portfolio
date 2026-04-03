import React, { useState } from 'react';
import type { PrototypeImage } from '../data/projects';

interface ThumbnailCardProps {
  images: PrototypeImage[];
  title?: string;
  stack?: string[];
  onClick?: () => void;
  className?: string;
}

const ThumbnailCard: React.FC<ThumbnailCardProps> = ({
  images,
  title,
  stack,
  onClick,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (images.length === 0) {
    return (
      <div
        className={`relative rounded-xl overflow-hidden border border-gray-800 bg-gradient-to-br from-purple-900/30 to-pink-900/30 aspect-video flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        <div className="text-5xl text-gray-400">📁</div>
        <div className="absolute bottom-3 right-3 bg-gray-900/80 text-gray-300 text-xs px-2 py-1 rounded-full">
          暂无图片
        </div>
      </div>
    );
  }

  const firstImage = images[0];
  const hasMultipleImages = images.length > 1;

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-gray-800 cursor-pointer transition-all duration-300 ${
        isHovered ? 'border-purple-500 shadow-lg shadow-purple-500/20 scale-[1.02]' : 'hover:border-purple-500'
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* 缩略图 */}
      <div className="aspect-video relative bg-gradient-to-br from-purple-900/30 to-pink-900/30">
        <img
          src={firstImage.thumbnailUrl || firstImage.url}
          alt={title || '项目缩略图'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            console.error('ThumbnailCard: Image failed to load', {
              src: firstImage.thumbnailUrl || firstImage.url,
              imageId: firstImage.id,
              imageName: firstImage.originalName
            });
            e.currentTarget.style.display = 'none';
          }}
          onLoad={() => {
            console.log('ThumbnailCard: Image loaded successfully', {
              src: firstImage.thumbnailUrl || firstImage.url,
              imageId: firstImage.id
            });
          }}
        />

        {/* 悬停叠加层 */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="p-4 text-center">
            <div className="text-white font-medium mb-1">
              点击查看{hasMultipleImages ? ` ${images.length} 张图片` : '大图'}
            </div>
            {title && (
              <div className="text-gray-300 text-sm truncate">{title}</div>
            )}
          </div>
        </div>

        {/* 图片数量指示器 */}
        {hasMultipleImages && (
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-full">
            +{images.length - 1}
          </div>
        )}

        {/* 加载骨架 */}
        {!firstImage.thumbnailUrl && !firstImage.url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl text-gray-400">🖼️</div>
          </div>
        )}
      </div>

      {/* 底部信息栏 */}
      {(title || stack) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
          {title && (
            <div className="text-white font-medium text-sm truncate mb-1">
              {title}
            </div>
          )}
          {stack && stack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {stack.slice(0, 3).map((tech, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-gray-800/80 text-gray-300 text-xs rounded-full"
                >
                  {tech}
                </span>
              ))}
              {stack.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-800/80 text-gray-300 text-xs rounded-full">
                  +{stack.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 悬停时的放大图标 */}
      {isHovered && (
        <div className="absolute top-3 left-3 bg-black/60 text-white p-2 rounded-full">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ThumbnailCard;