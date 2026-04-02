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

export const projects: Project[] = [
  {
    id: 1,
    name: 'E‑Commerce Platform',
    stack: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    description: 'A full‑stack online store with cart, checkout, and admin dashboard.',
    demoUrl: 'https://demo.example.com',
    type: 'link',
  },
  {
    id: 2,
    name: 'Task Management App',
    stack: ['TypeScript', 'Next.js', 'Socket.io', 'Tailwind'],
    description: 'Collaborative task board with drag‑and‑drop and real‑time updates.',
    demoUrl: 'https://tasks.example.com',
    type: 'embed',
  },
  {
    id: 3,
    name: 'Figma Mobile App Design',
    stack: ['Figma', 'UI/UX Design', 'Prototyping'],
    description: 'Complete mobile app design with interactive prototypes and design system.',
    demoUrl: '',
    type: 'prototype',
    images: [
      {
        id: 'img-1',
        url: 'https://picsum.photos/800/600?random=1',
        thumbnailUrl: 'https://picsum.photos/200/200?random=1',
        previewUrl: 'https://picsum.photos/800/600?random=1',
        originalName: 'login-screen.png',
        size: 1024 * 1024,
        mimeType: 'image/png',
        uploadOrder: 1,
      },
      {
        id: 'img-2',
        url: 'https://picsum.photos/800/600?random=2',
        thumbnailUrl: 'https://picsum.photos/200/200?random=2',
        previewUrl: 'https://picsum.photos/800/600?random=2',
        originalName: 'dashboard.png',
        size: 1.5 * 1024 * 1024,
        mimeType: 'image/png',
        uploadOrder: 2,
      },
      {
        id: 'img-3',
        url: 'https://picsum.photos/800/600?random=3',
        thumbnailUrl: 'https://picsum.photos/200/200?random=3',
        previewUrl: 'https://picsum.photos/800/600?random=3',
        originalName: 'settings.png',
        size: 0.8 * 1024 * 1024,
        mimeType: 'image/png',
        uploadOrder: 3,
      },
    ],
    thumbnail: 'https://picsum.photos/200/200?random=1',
  },
];