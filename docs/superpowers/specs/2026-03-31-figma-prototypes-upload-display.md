---
name: Figma Prototypes Upload and Display System
description: 一体化扩展方案，在现有个人作品集网站上添加Figma原型图上传和展示功能
type: spec
---

# Figma原型图上传与展示系统设计文档

## 项目概述

### 目标
在现有的个人作品集网站中集成Figma原型图上传和展示功能，支持用户上传PNG格式的Figma原型图，并在网站中以缩略图和详细视图展示。

### 核心需求
1. **上传功能**：支持多文件上传（PNG/JPG格式，≤5MB/文件，≤10文件/项目）
2. **展示功能**：在项目卡片中显示缩略图，点击可放大查看详细视图
3. **管理功能**：基本的CRUD操作（创建、读取、更新、删除）
4. **集成性**：与现有Projects系统无缝集成，同时提供独立的原型图展示页面

### 用户场景
1. **设计师**：上传Figma设计稿，展示设计作品
2. **访客**：浏览原型图，了解项目设计细节
3. **管理员**：管理原型图文件，调整展示顺序

## 系统架构

### 1. 架构决策说明
**当前现状**：项目目前是纯前端React应用，使用Vite开发服务器，数据存储在静态TypeScript文件中（`src/data/projects.ts`）。

**架构选择**：为了支持文件上传、图片处理和持久化存储，选择添加Node.js后端服务。此决策基于以下考虑：
- 文件上传需要服务器端处理（安全验证、图片处理、持久化存储）
- 图片处理（缩略图生成）需要在服务端进行（使用Sharp库）
- 需要数据库存储图片元数据和项目关联关系
- 生产环境需要独立的文件服务

**集成方案**：
- **开发环境**：前端运行在Vite开发服务器（端口5173），后端运行在Express服务器（端口3001），通过CORS跨域通信
- **生产环境**：前端构建为静态文件，通过Nginx反向代理统一端口，API请求代理到后端服务
- **数据迁移**：现有静态项目数据将初始化到数据库中，保持向后兼容

### 2. 技术栈
- **前端**：React + TypeScript + Tailwind CSS (现有)
- **后端**：Node.js + Express (新增，端口3001)
- **数据库**：SQLite (轻量级，适合小型项目)
- **图片处理**：Sharp (生成缩略图和预览图)
- **文件上传**：Multer (处理多文件上传)
- **身份验证**：简单API密钥（环境变量配置）

### 2. 架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  前端 React     │    │  后端 Express   │    │   存储层        │
│  (Vite dev)     │◄──►│  (Port 3001)    │◄──►│   uploads/      │
│                 │    │                 │    │   SQLite DB     │
│  • Projects扩展 │    │  • REST API     │    │   • 文件系统    │
│  • 上传组件     │    │  • 文件处理     │    │   • 数据库      │
│  • 展示组件     │    │  • 图片处理     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                          ┌─────────────────┐
                          │   客户端浏览器   │
                          │  (用户交互)     │
                          └─────────────────┘
```

### 3. 数据流
1. **上传流程**：前端选择文件 → Multer接收 → Sharp处理 → 存储文件 → 记录数据库 → 返回URL → 前端展示
2. **展示流程**：请求项目数据 → 获取图片URL → 加载缩略图 → 点击查看详情 → 加载预览图 → 交互浏览
3. **删除流程**：前端删除请求 → 后端删除记录 → 删除文件系统文件 → 返回结果

## 前端设计

### 1. 数据模型扩展
```typescript
// src/data/projects.ts
export interface Project {
  id: number;
  name: string;
  stack: string[];
  description: string;
  demoUrl: string;
  type: 'embed' | 'link' | 'prototype';  // 新增原型图类型
  images?: PrototypeImage[];             // 图片数组
  thumbnail?: string;                    // 首张图片缩略图URL
  createdAt?: string;                    // 创建时间
}

export interface PrototypeImage {
  id: string;           // UUID
  url: string;          // 原始图片URL
  thumbnailUrl: string; // 缩略图URL (200x200)
  previewUrl: string;   // 预览图URL (800x600)
  originalName: string; // 原始文件名
  size: number;         // 文件大小(bytes)
  mimeType: string;     // 文件类型
  uploadOrder: number;  // 上传顺序
}
```

### 2. 组件扩展

#### **Projects组件扩展** (`Projects.tsx`)
- **表单扩展**：在现有模态框中添加多文件上传区域
- **展示扩展**：项目卡片显示图片缩略图或占位符
- **新增功能**：图片预览模态框、拖拽排序、批量上传
- **类型切换**：项目类型增加"prototype"选项

#### **新增组件**
1. **`FileUploader.tsx`**：拖拽上传、文件预览、进度显示
2. **`ImageGalleryModal.tsx`**：图片画廊、放大查看、导航切换
3. **`ThumbnailCard.tsx`**：缩略图卡片、悬停效果、技术栈标签
4. **`PrototypesGallery.tsx`**：独立展示页面、筛选排序、网格布局
5. **`UploadService.ts`**：文件上传API客户端、进度管理、错误处理

### 3. 上传界面设计

#### **上传流程**
1. **选择文件**：拖拽或点击选择，支持多选
2. **预览验证**：显示缩略图，验证文件类型和大小
3. **调整顺序**：拖拽调整图片显示顺序
4. **开始上传**：显示进度条，支持暂停/取消
5. **完成反馈**：成功/失败状态提示

#### **用户体验优化**
- **拖拽上传**：支持将图片拖拽到上传区域
- **批量操作**：一次选择多张图片，并行上传
- **预览排序**：上传前可拖动调整图片顺序
- **错误处理**：详细的错误提示和恢复建议
- **进度反馈**：实时上传进度和状态显示

### 4. 展示界面设计

#### **项目卡片展示**
- **缩略图显示**：显示首张图片的缩略图
- **多图指示**：显示图片数量徽章
- **悬停效果**：鼠标悬停显示放大查看提示
- **技术栈标签**：显示关联的技术栈标签

#### **详细视图**
- **画廊模式**：多图片左右切换浏览
- **放大查看**：支持缩放查看设计细节
- **导航控制**：键盘导航（左右箭头、ESC退出）
- **下载功能**：提供原图下载链接
- **缩略图导航**：底部缩略图快速跳转

#### **独立展示页面** (`/prototypes`)
- **网格布局**：响应式网格展示所有原型图项目
- **筛选功能**：按技术栈、日期范围筛选
- **排序功能**：按名称、创建时间、图片数量排序
- **搜索功能**：关键词搜索项目名和描述
- **上传入口**：快速上传新原型图的便捷入口

## 后端API设计

### 1. API端点设计

#### **简化设计原则**
- 保持RESTful风格，但简化端点数量
- 单个端点处理多文件上传
- 图片通过统一的资源端点访问，支持查询参数控制尺寸

#### **核心端点**
```
# 项目管理（兼容现有前端数据流）
GET    /api/projects           # 获取所有项目（包含原型图）
POST   /api/projects           # 创建新项目（支持直接上传图片）
GET    /api/projects/:id       # 获取单个项目详情
PUT    /api/projects/:id       # 更新项目信息
DELETE /api/projects/:id       # 删除项目（级联删除关联图片）

# 图片上传（单端点处理多文件）
POST   /api/projects/:id/images  # 为指定项目上传图片
                                   # 支持多文件，返回处理后的URL数组

# 图片管理
DELETE /api/images/:imageId      # 删除单张图片
PUT    /api/images/:imageId/order # 更新图片显示顺序

# 图片访问（智能服务）
GET    /api/images/:imageId      # 获取图片
                                   # 查询参数：?size=original|preview|thumbnail
                                   # 查询参数：?width=800&height=600（自定义尺寸）
```

#### **与现有前端集成**
- 前端继续使用现有数据流，通过API获取更新后的项目数据
- 上传组件直接调用`/api/projects/:id/images`端点
- 图片展示使用统一的图片服务端点，自动选择合适尺寸

### 2. 数据结构

#### **数据库表设计**
```sql
-- 项目表（扩展现有逻辑）
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  demo_url TEXT,
  type TEXT CHECK(type IN ('link', 'embed', 'prototype')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 技术栈关联表
CREATE TABLE project_technologies (
  project_id INTEGER,
  technology TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 图片表
CREATE TABLE project_images (
  id TEXT PRIMARY KEY, -- UUID
  project_id INTEGER,
  filename TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size INTEGER,
  thumbnail_path TEXT,
  preview_path TEXT,
  original_path TEXT,
  upload_order INTEGER, -- 图片顺序
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### 3. 文件处理与存储

#### **存储架构**
```
项目根目录/
├── server/              # 后端服务代码
│   ├── uploads/         # 上传文件存储
│   │   ├── YYYY-MM-DD/  # 按日期组织
│   │   │   ├── originals/    # 原始文件
│   │   │   ├── thumbnails/   # 缩略图 200x200
│   │   │   └── previews/     # 预览图 800x600
│   │   └── temp/        # 临时文件（定期清理）
│   ├── database/        # SQLite数据库文件
│   └── ...              # 后端源代码
└── 前端项目目录/         # 现有React前端
```

#### **图片处理流程**
```javascript
// 1. 文件验证阶段
const validateFile = (file) => {
  // 检查文件类型（仅允许PNG/JPG）
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  // 检查文件大小（≤5MB）
  const maxSize = 5 * 1024 * 1024;
  // 检查文件数量（≤10个/项目）
  // 返回验证结果或错误信息
};

// 2. 文件处理阶段
const processImage = async (fileBuffer, originalName) => {
  // 生成唯一ID和存储路径
  const imageId = uuid.v4();
  const dateFolder = dayjs().format('YYYY-MM-DD');
  const basePath = path.join('uploads', dateFolder, imageId);

  // 创建目录结构
  await fs.ensureDir(path.join(basePath, 'originals'));
  await fs.ensureDir(path.join(basePath, 'thumbnails'));
  await fs.ensureDir(path.join(basePath, 'previews'));

  // 保存原始文件
  const originalPath = path.join(basePath, 'originals', originalName);
  await fs.writeFile(originalPath, fileBuffer);

  // 使用Sharp处理图片
  const sharpInstance = sharp(fileBuffer);

  // 生成缩略图（200x200，裁剪适应）
  const thumbnailPath = path.join(basePath, 'thumbnails', 'thumbnail.jpg');
  await sharpInstance
    .clone()
    .resize(200, 200, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 70 })
    .toFile(thumbnailPath);

  // 生成预览图（800x600，保持比例）
  const previewPath = path.join(basePath, 'previews', 'preview.jpg');
  await sharpInstance
    .clone()
    .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(previewPath);

  // 返回处理结果
  return {
    imageId,
    paths: { original: originalPath, thumbnail: thumbnailPath, preview: previewPath },
    metadata: await sharpInstance.metadata()
  };
};

// 3. 数据库记录阶段
const saveImageRecord = async (projectId, imageData, uploadOrder) => {
  // 保存到SQLite数据库
  const record = {
    id: imageData.imageId,
    project_id: projectId,
    filename: path.basename(imageData.paths.original),
    original_name: originalName,
    mime_type: 'image/jpeg',
    size: fileBuffer.length,
    thumbnail_path: imageData.paths.thumbnail,
    preview_path: imageData.paths.preview,
    original_path: imageData.paths.original,
    upload_order: uploadOrder,
    created_at: new Date().toISOString()
  };
  // 插入数据库...
};
```

#### **并发处理优化**
- **限制并发数**：同时处理最多3个文件，避免服务器过载
- **进度反馈**：使用WebSocket或长轮询向客户端发送处理进度
- **错误恢复**：单个文件处理失败不影响其他文件，可重试失败的文件
- **内存管理**：使用流式处理大文件，及时清理内存

### 4. 错误处理

#### **HTTP状态码**
- `200`：成功
- `400`：客户端错误（文件类型、大小、数量）
- `413`：文件过大
- `415`：不支持的媒体类型
- `500`：服务器内部错误

#### **错误响应格式**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "文件大小不能超过5MB",
  "details": {
    "maxSize": 5242880,
    "actualSize": 7340032
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 安全设计

### 1. 身份验证与授权
- **API密钥认证**：后端服务使用环境变量配置的API密钥
  ```javascript
  // 中间件示例
  const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };
  ```
- **操作权限**：所有修改操作（上传、删除、更新）需要API密钥
- **只读访问**：图片查看和项目查询不需要认证

### 2. 文件上传安全
- **类型验证**：检查文件扩展名和MIME类型，仅允许PNG/JPG
- **文件头验证**：使用文件魔数验证实际文件类型，防止伪装攻击
- **大小限制**：单个文件≤5MB，单次请求总大小≤50MB
- **数量限制**：每个项目最多10张图片，防止资源耗尽
- **病毒扫描**：考虑集成ClamAV等病毒扫描工具（未来扩展）
- **文件名安全**：移除特殊字符，使用UUID重命名，防止路径遍历

### 3. API安全
- **CORS配置**：严格限制源站，开发环境允许本地Vite服务器
  ```javascript
  app.use(cors({
    origin: process.env.NODE_ENV === 'development'
      ? 'http://localhost:5173'
      : 'https://yourdomain.com',
    credentials: true
  }));
  ```
- **输入验证**：所有请求参数验证和清理，使用Joi或Zod
- **速率限制**：限制上传端点的请求频率，防止滥用
- **SQL注入防护**：使用参数化查询，避免直接拼接SQL
- **XSS防护**：输出编码，设置安全的HTTP头（CSP）

### 4. 文件系统安全
- **目录隔离**：上传文件存储在专用目录，与代码分离
- **权限控制**：文件系统权限设置为最小必要权限
- **路径安全**：使用绝对路径，规范化用户输入路径
- **定期清理**：定时清理未关联的临时文件和旧文件

### 5. 生产环境安全
- **错误信息**：生产环境隐藏详细错误信息，记录到日志
- **安全头**：设置安全的HTTP头（HSTS, X-Frame-Options等）
- **日志记录**：记录所有上传、删除操作，便于审计
- **监控告警**：监控异常上传行为（频率、大小、类型）

## 性能优化

### 1. 图片优化
- **懒加载**：使用Intersection Observer实现图片懒加载
- **预加载**：画廊中预加载相邻图片
- **缓存策略**：缩略图和预览图使用强缓存（1年）
- **响应式图片**：根据设备提供合适尺寸的图片

### 2. 上传优化
- **分块上传**：大文件分块上传，支持断点续传
- **并行处理**：限制并发数，避免服务器过载
- **进度反馈**：实时上传进度显示
- **内存管理**：流式处理大文件，避免内存溢出

### 3. 展示优化
- **虚拟滚动**：大量图片时使用虚拟滚动
- **图片CDN**：考虑使用CDN分发图片（未来扩展）
- **压缩传输**：启用gzip压缩传输
- **缓存策略**：合理配置HTTP缓存头

## 部署与运维

### 1. 环境要求与配置

#### **开发环境**
- **Node.js**：≥18.0.0
- **前端端口**：5173（Vite开发服务器）
- **后端端口**：3001（Express服务器）
- **存储空间**：至少1GB可用空间（用于上传文件）

#### **生产环境**
- **服务器**：Linux服务器（Ubuntu 20.04+ 或 CentOS 7+）
- **Node.js**：≥18.0.0（使用nvm管理版本）
- **内存**：至少1GB RAM（图片处理需要额外内存）
- **存储**：根据预估使用量配置，建议预留10GB+空间
- **数据库**：SQLite（内嵌，无需单独安装）

#### **环境变量配置**
```bash
# .env文件示例
NODE_ENV=production
PORT=3001
API_KEY=your_secure_api_key_here
DATABASE_PATH=./database/projects.db
UPLOAD_PATH=./uploads
CORS_ORIGIN=https://yourdomain.com
MAX_FILE_SIZE=5242880  # 5MB
MAX_FILES_PER_PROJECT=10
```

### 2. 部署架构

#### **开发环境部署**
```
┌─────────────────┐    ┌─────────────────┐
│  前端 React     │    │  后端 Express   │
│  (localhost:5173)│◄──►│ (localhost:3001) │
│  Vite Dev Server │    │   API服务       │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
              ┌─────────────┐
              │  文件系统    │
              │  uploads/   │
              │  database/  │
              └─────────────┘
```

#### **生产环境部署**（使用Nginx反向代理）
```
                               ┌─────────────────┐
                          ┌───►│  前端静态文件   │
                          │    │  /var/www/html  │
                          │    └─────────────────┘
┌─────────────┐    ┌─────────────┐    │
│   用户访问    │    │   Nginx     │    │
│  yourdomain.com│◄──►│ 反向代理    │◄───┤
└─────────────┘    └─────────────┘    │
                          │            │
                          │    ┌─────────────────┐
                          └───►│  后端 Express   │
                               │  (localhost:3001)│
                               │   API服务       │
                               └─────────────────┘
```

### 3. 详细部署步骤

#### **步骤1：服务器准备**
```bash
# 1. 安装Node.js和npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 2. 安装PM2（进程管理）
npm install -g pm2

# 3. 安装Nginx
sudo apt update
sudo apt install nginx -y
```

#### **步骤2：项目部署**
```bash
# 1. 克隆项目
git clone <your-repo-url> /var/www/personal-portfolio
cd /var/www/personal-portfolio

# 2. 安装依赖
npm install
cd server && npm install

# 3. 环境配置
cp .env.example .env
# 编辑.env文件，配置API密钥等

# 4. 构建前端
npm run build

# 5. 启动后端服务（使用PM2）
cd server
pm2 start server.js --name "portfolio-api"
pm2 save
pm2 startup
```

#### **步骤3：Nginx配置**
```nginx
# /etc/nginx/sites-available/portfolio
server {
    listen 80;
    server_name yourdomain.com;

    # 前端静态文件
    location / {
        root /var/www/personal-portfolio/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 图片文件服务
    location /uploads/ {
        root /var/www/personal-portfolio/server;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### **步骤4：SSL证书（可选但推荐）**
```bash
# 使用Let's Encrypt获取SSL证书
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

### 4. 监控与维护

#### **日志管理**
- **应用日志**：PM2管理日志，`pm2 logs portfolio-api`
- **访问日志**：Nginx访问日志 `/var/log/nginx/access.log`
- **错误日志**：Nginx错误日志 `/var/log/nginx/error.log`
- **文件日志**：自定义应用日志记录上传、删除等操作

#### **性能监控**
- **PM2监控**：`pm2 monit` 查看CPU、内存使用情况
- **磁盘监控**：监控`uploads/`目录大小，设置警报阈值
- **API监控**：监控响应时间、错误率、请求频率

#### **备份策略**
- **数据库备份**：定期备份SQLite数据库文件
  ```bash
  # 每日备份
  0 2 * * * cp /var/www/personal-portfolio/server/database/projects.db /backup/projects-$(date +\%Y\%m\%d).db
  ```
- **文件备份**：定期备份`uploads/`目录
- **配置备份**：备份环境变量和Nginx配置

#### **维护任务**
- **定期清理**：清理超过30天的临时文件
- **日志轮转**：配置logrotate管理日志文件
- **安全更新**：定期更新Node.js和Nginx安全补丁
- **容量规划**：监控存储使用，提前规划扩容

## 测试计划

### 1. 单元测试

#### **前端测试**（使用Jest + React Testing Library）
```javascript
// FileUploader.test.tsx
describe('FileUploader组件', () => {
  test('文件验证：类型检查', () => {
    // 测试PNG、JPG文件通过，其他类型拒绝
  });

  test('文件验证：大小检查', () => {
    // 测试5MB以下文件通过，超过5MB拒绝
  });

  test('上传进度显示', () => {
    // 测试进度条根据上传进度更新
  });

  test('错误处理', () => {
    // 测试网络错误、服务器错误等情况的用户反馈
  });
});

// ImageGalleryModal.test.tsx
describe('图片画廊组件', () => {
  test('图片切换功能', () => {
    // 测试左右箭头切换图片
  });

  test('键盘导航', () => {
    // 测试ESC关闭、左右箭头切换
  });

  test('图片懒加载', () => {
    // 测试图片进入视口时加载
  });
});
```

#### **后端测试**（使用Jest + Supertest）
```javascript
// upload.test.js
describe('文件上传API', () => {
  test('单文件上传成功', async () => {
    // 模拟文件上传，验证返回的URL和元数据
  });

  test('多文件上传成功', async () => {
    // 模拟多文件上传，验证所有文件处理完成
  });

  test('文件类型验证失败', async () => {
    // 上传非图片文件，验证返回400错误
  });

  test('文件大小超限', async () => {
    // 上传超过5MB的文件，验证返回413错误
  });

  test('身份验证失败', async () => {
    // 不使用API密钥上传，验证返回401错误
  });
});

// image-processing.test.js
describe('图片处理逻辑', () => {
  test('缩略图生成', async () => {
    // 验证生成的缩略图尺寸为200x200
  });

  test('预览图生成', async () => {
    // 验证生成的预览图最大边长为800px，保持比例
  });

  test('图片质量压缩', async () => {
    // 验证压缩后的图片质量在可接受范围内
  });
});
```

### 2. 集成测试

#### **端到端测试**（使用Cypress）
```javascript
// upload-flow.cy.js
describe('文件上传完整流程', () => {
  it('从选择文件到展示的完整流程', () => {
    // 1. 访问网站，点击上传按钮
    // 2. 选择PNG文件，验证预览显示
    // 3. 点击上传，验证进度显示
    // 4. 上传完成，验证图片显示在项目中
    // 5. 点击图片，验证放大查看功能
    // 6. 删除图片，验证从界面消失
  });

  it('多文件上传和排序', () => {
    // 1. 选择多个文件
    // 2. 拖拽调整顺序
    // 3. 上传后验证顺序保持
  });

  it('错误处理流程', () => {
    // 1. 选择超大文件，验证错误提示
    // 2. 选择错误类型文件，验证错误提示
    // 3. 网络断开，验证上传失败处理
  });
});

// api-integration.cy.js
describe('前后端集成测试', () => {
  it('项目创建与图片关联', () => {
    // 创建新项目 → 上传图片 → 验证关联关系
  });

  it('数据一致性验证', () => {
    // 在前端操作，验证后端数据同步更新
  });
});
```

### 3. 性能测试

#### **负载测试**（使用k6）
```javascript
// upload-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // 10个虚拟用户
    { duration: '1m', target: 25 },   // 25个虚拟用户
    { duration: '30s', target: 0 },   // 逐渐减少
  ],
};

export default function () {
  // 模拟文件上传请求
  const url = 'http://localhost:3001/api/upload';
  const payload = {
    // 模拟文件数据
  };

  const params = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'x-api-key': __ENV.API_KEY,
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    '上传成功': (r) => r.status === 200,
    '响应时间<5s': (r) => r.timings.duration < 5000,
  });

  sleep(1);
}
```

#### **性能指标**
- **API响应时间**：P95 < 3秒，P99 < 5秒
- **图片处理时间**：单张图片处理 < 2秒
- **并发处理能力**：支持至少10个并发上传
- **内存使用**：处理过程中内存使用稳定，无泄漏

### 4. 兼容性测试矩阵

#### **浏览器兼容性**
| 浏览器 | 版本 | 测试重点 |
|--------|------|----------|
| Chrome | 90+ | 完整功能 |
| Firefox | 88+ | 完整功能 |
| Safari | 14+ | 文件API兼容性 |
| Edge | 90+ | 完整功能 |

#### **设备兼容性**
- **桌面端**：1920x1080, 1366x768, 1280x720
- **平板端**：iPad (1024x768), iPad Pro (2048x2732)
- **手机端**：iPhone SE (375x667), iPhone 12 Pro (390x844), 安卓常见尺寸

#### **网络条件测试**
- **高速网络**：光纤（100Mbps+），验证快速上传
- **低速网络**：3G（1Mbps），验证进度显示和超时处理
- **不稳定网络**：模拟网络中断，验证错误恢复

### 5. 安全测试

#### **渗透测试要点**
- **文件上传绕过**：尝试上传恶意文件，验证防护
- **路径遍历**：尝试访问系统文件，验证路径安全
- **API滥用**：尝试未授权访问，验证身份验证
- **XSS测试**：尝试注入脚本，验证输出编码

#### **安全扫描工具**
- **OWASP ZAP**：自动化安全扫描
- **Nessus**：漏洞扫描
- **手动测试**：关键功能手动安全测试

## 未来扩展

### 1. 功能扩展
- **用户系统**：用户账户、个人图片库、权限管理
- **协作功能**：评论、标注、版本控制
- **高级编辑**：在线标注、尺寸标注、颜色提取

### 2. 技术扩展
- **云存储**：集成AWS S3、Cloudinary等云存储服务
- **CDN加速**：使用CDN加速图片分发
- **WebP支持**：自动转换为WebP格式以减小文件大小

### 3. 体验优化
- **AI优化**：使用AI自动生成图片描述和标签
- **智能裁剪**：基于内容识别的智能裁剪
- **离线支持**：PWA支持离线查看已缓存的图片

## 验收标准

### 1. 核心功能
- [ ] 支持PNG/JPG文件上传（≤5MB，≤10文件）
- [ ] 自动生成缩略图（200x200）和预览图（800x600）
- [ ] 在项目卡片中显示图片缩略图
- [ ] 点击缩略图可放大查看详细视图
- [ ] 支持多图片左右切换浏览
- [ ] 提供独立的原型图展示页面（/prototypes）

### 2. 用户体验
- [ ] 拖拽上传支持
- [ ] 上传进度实时显示
- [ ] 详细的错误提示和恢复建议
- [ ] 响应式设计，支持移动端
- [ ] 键盘导航支持（ESC退出，左右箭头切换）

### 3. 性能要求
- [ ] 页面加载时间 < 3秒
- [ ] 图片加载延迟 < 2秒
- [ ] 上传响应时间 < 5秒（正常网络）
- [ ] 支持至少10个并发上传

### 4. 安全要求
- [ ] 文件类型和大小验证
- [ ] 防止目录遍历攻击
- [ ] 合理的文件权限设置
- [ ] 生产环境错误信息隐藏

---

**文档版本**：1.0
**创建日期**：2026-03-31
**最后更新**：2026-03-31
**状态**：草案 → 评审中