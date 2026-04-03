import React, { useState, useMemo } from 'react';
import type { Project } from '../data/projects';
import ThumbnailCard from './ThumbnailCard';
import ImageGalleryModal from './ImageGalleryModal';

interface PrototypesGalleryProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
}

const PrototypesGallery: React.FC<PrototypesGalleryProps> = ({
  projects,
  onProjectClick,
}) => {
  // 过滤出prototype类型的项目
  const prototypeProjects = useMemo(() => {
    return projects.filter(project => project.type === 'prototype');
  }, [projects]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'images'>('name');
  const [galleryOpen, setGalleryOpen] = useState(false);

  // 搜索和排序
  const filteredProjects = useMemo(() => {
    let filtered = prototypeProjects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.stack.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // 排序
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'date':
        // 如果没有日期字段，按ID排序（假设ID越大越新）
        filtered.sort((a, b) => b.id - a.id);
        break;
      case 'images':
        filtered.sort((a, b) => {
          const aImages = a.images?.length || 0;
          const bImages = b.images?.length || 0;
          return bImages - aImages;
        });
        break;
    }

    return filtered;
  }, [prototypeProjects, searchQuery, sortBy]);

  const handleProjectClick = (project: Project) => {
    if (onProjectClick) {
      onProjectClick(project);
    } else {
      setSelectedProject(project);
      setGalleryOpen(true);
    }
  };

  const closeGallery = () => {
    setGalleryOpen(false);
    setSelectedProject(null);
  };

  const totalImages = prototypeProjects.reduce(
    (sum, project) => sum + (project.images?.length || 0),
    0
  );

  return (
    <div className="py-8 bg-[#0a0a0a]">
      {/* 标题和统计 */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">原型图画廊</h2>
        <p className="text-gray-400">
          共 {prototypeProjects.length} 个原型项目，{totalImages} 张图片
        </p>
      </div>

      {/* 搜索和筛选工具栏 */}
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
        {/* 搜索框 */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目名称、描述或技术栈..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-3 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 排序选项 */}
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">排序:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === 'name'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              名称
            </button>
            <button
              onClick={() => setSortBy('date')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === 'date'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              最新
            </button>
            <button
              onClick={() => setSortBy('images')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === 'images'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              图片数量
            </button>
          </div>
        </div>
      </div>

      {/* 项目网格 */}
      {filteredProjects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-colors cursor-pointer group"
              onClick={() => handleProjectClick(project)}
            >
              {/* 缩略图区域 */}
              <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-pink-900/20 overflow-hidden relative">
                {project.images && project.images.length > 0 ? (
                  <>
                    <ThumbnailCard
                      images={project.images}
                      title={project.name}
                      stack={project.stack}
                      className="w-full h-full"
                    />
                    {/* 图片数量指示器 */}
                    <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      {project.images.length} 张
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-5xl text-gray-600">📁</div>
                  </div>
                )}
              </div>

              {/* 项目信息 */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1 truncate">{project.name}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{project.description}</p>

                {/* 技术栈标签 */}
                <div className="flex flex-wrap gap-1">
                  {project.stack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.stack.length > 3 && (
                    <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded">
                      +{project.stack.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 空状态 */
        <div className="text-center py-16">
          <div className="text-6xl text-gray-700 mb-4">📁</div>
          <h3 className="text-xl text-gray-300 mb-2">没有找到原型项目</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchQuery
              ? `没有找到与"${searchQuery}"相关的原型项目`
              : '暂时没有添加原型项目。请在Projects页面添加原型图项目。'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-purple-400 hover:text-purple-300"
            >
              清除搜索
            </button>
          )}
        </div>
      )}

      {/* 画廊模态框 */}
      {galleryOpen && selectedProject && selectedProject.images && selectedProject.images.length > 0 && (
        <ImageGalleryModal
          images={selectedProject.images}
          isOpen={galleryOpen}
          onClose={closeGallery}
          title={selectedProject.name}
        />
      )}
    </div>
  );
};

export default PrototypesGallery;