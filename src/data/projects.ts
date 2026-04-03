export interface PrototypeImage {
  id: string;           // UUID
  url: string;          // 原始图片URL（模拟）
  thumbnailUrl: string; // 缩略图URL (200x200)（模拟）
  previewUrl: string;   // 预览图URL (800x600)（模拟）
  originalName: string; // 原始文件名
  size: number;         // 文件大小(bytes)
  mimeType: string;     // 文件类型
  uploadOrder: number;  // 上传顺序
}

export interface Project {
  id: number;
  name: string;
  stack: string[];
  description: string;
  demoUrl: string;
  type: 'embed' | 'link' | 'prototype';  // 新增prototype类型
  images?: PrototypeImage[];             // 新增：原型图图片数组
  thumbnail?: string;                    // 新增：首张图片缩略图URL
}

export const projects: Project[] = [];