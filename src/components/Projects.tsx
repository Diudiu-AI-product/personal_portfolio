import React, { useState, useEffect } from 'react';
import { projects as initialProjects } from '../data/projects';
import type { Project, PrototypeImage } from '../data/projects';
import FileUploader from './FileUploader';
import ThumbnailCard from './ThumbnailCard';
import ImageGalleryModal from './ImageGalleryModal';
import PrototypesGallery from './PrototypesGallery';
import { uploadService } from '../services/UploadService';

const Projects: React.FC = () => {
  const STORAGE_KEY = 'personal_portfolio_projects';

  // 从localStorage加载项目数据，移除无效的图片URL
  const loadProjectsFromStorage = (): Project[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return initialProjects;

      const parsed = JSON.parse(stored) as Project[];
      // 清理可能无效的对象URL
      return parsed.map(project => ({
        ...project,
        // 如果是prototype类型且有图片，但图片URL可能是无效的对象URL，移除图片数据
        images: project.type === 'prototype' && project.images
          ? project.images.map(img => ({
              ...img,
              // 如果是对象URL，标记为需要重新上传
              url: img.url.startsWith('blob:') ? '' : img.url,
              thumbnailUrl: img.thumbnailUrl.startsWith('blob:') ? '' : img.thumbnailUrl,
              previewUrl: img.previewUrl.startsWith('blob:') ? '' : img.previewUrl,
            }))
          : project.images
      }));
    } catch (error) {
      console.error('加载项目数据失败:', error);
      return initialProjects;
    }
  };

  // 保存项目数据到localStorage
  const saveProjectsToStorage = (projects: Project[]): void => {
    try {
      // 序列化项目数据
      const serialized = JSON.stringify(projects);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('保存项目数据失败:', error);
    }
  };

  const [projects, setProjects] = useState<Project[]>(() => loadProjectsFromStorage());

  // 监听projects变化并保存到localStorage
  useEffect(() => {
    if (projects.length > 0) {
      saveProjectsToStorage(projects);
    }
  }, [projects]);

  // 组件卸载时清理对象URL
  useEffect(() => {
    return () => {
      uploadService.revokeAllObjectURLs();
    };
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'prototypes'>('all');
  const [newProject, setNewProject] = useState({
    id: 0,
    name: '',
    stack: [] as string[],
    description: '',
    demoUrl: '',
    type: 'link' as 'embed' | 'link' | 'prototype',
    currentTech: '',
    images: [] as File[],
  });
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [prototypeGalleryOpen, setPrototypeGalleryOpen] = useState(false);
  const [selectedPrototypeProject, setSelectedPrototypeProject] = useState<Project | null>(null);
  const [uploadedImages, setUploadedImages] = useState<PrototypeImage[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'type' && (value === 'embed' || value === 'link' || value === 'prototype')) {
      // 当类型改变时，如果是切换到非prototype类型，清除图片数据
      const updatedProject = { ...newProject, [name]: value as 'embed' | 'link' | 'prototype' };
      if (value !== 'prototype') {
        updatedProject.images = [];
      }
      setNewProject(updatedProject);
      if (value !== 'prototype') {
        setUploadedImages([]);
      }
    } else {
      setNewProject(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTech = () => {
    if (newProject.currentTech.trim()) {
      setNewProject(prev => ({
        ...prev,
        stack: [...prev.stack, prev.currentTech.trim()],
        currentTech: '',
      }));
    }
  };

  const handleRemoveTech = (index: number) => {
    setNewProject(prev => ({
      ...prev,
      stack: prev.stack.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const projectToAdd: Project = {
      id: projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
      name: newProject.name,
      stack: [...newProject.stack],
      description: newProject.description,
      demoUrl: newProject.demoUrl,
      type: newProject.type,
    };

    // 如果是prototype类型，添加图片数据
    if (newProject.type === 'prototype' && uploadedImages.length > 0) {
      projectToAdd.images = uploadedImages;
      projectToAdd.thumbnail = uploadedImages[0]?.thumbnailUrl || uploadedImages[0]?.url;
    }

    setProjects(prev => [...prev, projectToAdd]);
    setNewProject({
      id: 0,
      name: '',
      stack: [],
      description: '',
      demoUrl: '',
      type: 'link',
      currentTech: '',
      images: [],
    });
    setUploadedImages([]);
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
    setNewProject({
      id: 0,
      name: '',
      stack: [],
      description: '',
      demoUrl: '',
      type: 'link',
      currentTech: '',
      images: [],
    });
    setUploadedImages([]);
  };

  const handleFilesSelected = (files: File[]) => {
    setNewProject(prev => ({ ...prev, images: files }));
  };

  const handleUploadComplete = (images: PrototypeImage[]) => {
    setUploadedImages(images);
  };

  const openEmbedModal = (project: Project) => {
    setSelectedProject(project);
    setEmbedModalOpen(true);
  };

  const closeEmbedModal = () => {
    setEmbedModalOpen(false);
    setSelectedProject(null);
  };

  const openPrototypeGallery = (project: Project) => {
    setSelectedPrototypeProject(project);
    setPrototypeGalleryOpen(true);
  };

  const closePrototypeGallery = () => {
    setPrototypeGalleryOpen(false);
    setSelectedPrototypeProject(null);
  };

  return (
    <section id="projects" className="py-20 bg-[#0a0a0a]">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">Projects</h2>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* 视图切换按钮 */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              所有项目
            </button>
            <button
              onClick={() => setViewMode('prototypes')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'prototypes'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              仅原型图
            </button>
          </div>

          {/* 新增项目按钮 */}
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center space-x-2"
          >
            <span>+</span>
            <span>新增交付项目</span>
          </button>
        </div>
        {viewMode === 'all' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-colors"
              >
                <div className="h-48 bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center overflow-hidden">
                  {project.type === 'prototype' && project.images && project.images.length > 0 ? (
                    <ThumbnailCard
                      images={project.images}
                      title={project.name}
                      stack={project.stack}
                      onClick={() => openPrototypeGallery(project)}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="text-5xl text-gray-400">📁</div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                  <p className="text-gray-400 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 text-xs bg-gray-800 text-gray-300 rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    {project.type === 'link' ? (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        Live Demo
                      </a>
                    ) : project.type === 'embed' ? (
                      <button
                        onClick={() => openEmbedModal(project)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        嵌入式体验
                      </button>
                    ) : (
                      // prototype类型
                      project.images && project.images.length > 0 ? (
                        <button
                          onClick={() => openPrototypeGallery(project)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          查看原型
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm py-2">暂无原型图</span>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PrototypesGallery projects={projects} />
        )}
      </div>

      {/* Add Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-purple-900/90 to-pink-900/90 backdrop-blur-lg rounded-2xl border border-purple-700/50 shadow-2xl w-full max-w-2xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-white">新增交付项目</h3>
                <button
                  onClick={handleCancel}
                  className="text-purple-300 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* 项目名称 */}
                  <div>
                    <label className="block text-purple-200 mb-2 font-medium">项目名称</label>
                    <input
                      type="text"
                      name="name"
                      value={newProject.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-purple-900/50 border border-purple-700/50 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="输入项目名称"
                      required
                    />
                  </div>

                  {/* 技术栈 */}
                  <div>
                    <label className="block text-purple-200 mb-2 font-medium">技术栈</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newProject.currentTech}
                        onChange={(e) => setNewProject(prev => ({ ...prev, currentTech: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTech();
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-purple-900/50 border border-purple-700/50 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="输入技术名称，按添加按钮或回车"
                      />
                      <button
                        type="button"
                        onClick={handleAddTech}
                        className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        添加
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newProject.stack.map((tech, index) => (
                        <div key={index} className="flex items-center gap-1 px-3 py-1 bg-purple-800/70 text-purple-100 rounded-full text-sm">
                          <span>{tech}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTech(index)}
                            className="text-purple-300 hover:text-white ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 项目描述 */}
                  <div>
                    <label className="block text-purple-200 mb-2 font-medium">项目描述</label>
                    <textarea
                      name="description"
                      value={newProject.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-purple-900/50 border border-purple-700/50 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="详细描述项目功能、特点等"
                      required
                    />
                  </div>

                  {/* Demo URL */}
                  <div>
                    <label className="block text-purple-200 mb-2 font-medium">演示链接{newProject.type !== 'prototype' && ' (必填)'}</label>
                    <input
                      type="url"
                      name="demoUrl"
                      value={newProject.demoUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-purple-900/50 border border-purple-700/50 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://example.com"
                      required={newProject.type !== 'prototype'}
                    />
                    {newProject.type === 'prototype' && (
                      <p className="text-gray-400 text-sm mt-1">原型图项目可留空</p>
                    )}
                  </div>

                  {/* 原型图上传区域 */}
                  {newProject.type === 'prototype' && (
                    <div>
                      <label className="block text-purple-200 mb-2 font-medium">原型图上传</label>
                      <FileUploader
                        onFilesSelected={handleFilesSelected}
                        onUploadComplete={handleUploadComplete}
                        maxFiles={10}
                        maxSize={50 * 1024 * 1024}
                        allowedTypes={['image/png', 'image/jpeg', 'image/jpg']}
                        disabled={false}
                      />
                      {uploadedImages.length > 0 && (
                        <div className="mt-3 text-green-300 text-sm">
                          已上传 {uploadedImages.length} 张图片
                        </div>
                      )}
                    </div>
                  )}

                  {/* 类型选择 */}
                  <div>
                    <label className="block text-purple-200 mb-2 font-medium">项目类型</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="link"
                          checked={newProject.type === 'link'}
                          onChange={handleInputChange}
                          className="mr-2 text-purple-500"
                        />
                        <span className="text-purple-100">链接跳转</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="embed"
                          checked={newProject.type === 'embed'}
                          onChange={handleInputChange}
                          className="mr-2 text-purple-500"
                        />
                        <span className="text-purple-100">嵌入展示</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="prototype"
                          checked={newProject.type === 'prototype'}
                          onChange={handleInputChange}
                          className="mr-2 text-purple-500"
                        />
                        <span className="text-purple-100">原型图展示</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 按钮 */}
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-purple-700/50">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border border-purple-600 text-purple-300 rounded-lg font-medium hover:bg-purple-900/30 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    添加项目
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Embed Experience Modal */}
      {embedModalOpen && selectedProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop with animation */}
          <div
            className="absolute inset-0 bg-black/80 transition-opacity duration-300"
            onClick={closeEmbedModal}
          />

          {/* Modal container with animation */}
          <div className="relative w-full max-w-6xl bg-[#0a0a0a] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden transform transition-all duration-300 scale-95 opacity-0 animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedProject.name}</h3>
                <p className="text-gray-400 mt-1">{selectedProject.description}</p>
              </div>
              <button
                onClick={closeEmbedModal}
                className="text-gray-400 hover:text-white text-3xl transition-colors"
              >
                ×
              </button>
            </div>

            {/* Iframe container */}
            <div className="relative h-[70vh]">
              <iframe
                src={selectedProject.demoUrl}
                className="absolute inset-0 w-full h-full border-0"
                title={`${selectedProject.name} Demo`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/50">
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {selectedProject.stack.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs bg-gray-800 text-gray-300 rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <a
                  href={selectedProject.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  在新标签页打开
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prototype Image Gallery Modal */}
      {prototypeGalleryOpen && selectedPrototypeProject && selectedPrototypeProject.images && selectedPrototypeProject.images.length > 0 && (
        <ImageGalleryModal
          images={selectedPrototypeProject.images}
          isOpen={prototypeGalleryOpen}
          onClose={closePrototypeGallery}
          title={selectedPrototypeProject.name}
        />
      )}
    </section>
  );
};

export default Projects;