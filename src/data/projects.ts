export interface Project {
  id: number;
  name: string;
  description: string;
  techStack: string[];
  demoLink: string;
  githubLink: string;
  emoji: string;
}

export const projects: Project[] = [
  {
    id: 1,
    name: 'E‑Commerce Platform',
    description: 'A full‑stack online store with cart, checkout, and admin dashboard.',
    techStack: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    demoLink: 'https://demo.example.com',
    githubLink: 'https://github.com/example/ecommerce',
    emoji: '🛒',
  },
  {
    id: 2,
    name: 'Task Management App',
    description: 'Collaborative task board with drag‑and‑drop and real‑time updates.',
    techStack: ['TypeScript', 'Next.js', 'Socket.io', 'Tailwind'],
    demoLink: 'https://tasks.example.com',
    githubLink: 'https://github.com/example/taskapp',
    emoji: '✅',
  },
  {
    id: 3,
    name: 'Weather Dashboard',
    description: 'Beautiful weather app with forecasts, maps, and location search.',
    techStack: ['React', 'Chart.js', 'Weather API', 'CSS Grid'],
    demoLink: 'https://weather.example.com',
    githubLink: 'https://github.com/example/weather',
    emoji: '🌤️',
  },
  {
    id: 4,
    name: 'Portfolio Website',
    description: 'Responsive personal portfolio built with modern technologies.',
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
    demoLink: 'https://portfolio.example.com',
    githubLink: 'https://github.com/example/portfolio',
    emoji: '🎨',
  },
  {
    id: 5,
    name: 'Chat Application',
    description: 'Real‑time chat app with rooms, user authentication, and file sharing.',
    techStack: ['React', 'Firebase', 'Material‑UI', 'WebRTC'],
    demoLink: 'https://chat.example.com',
    githubLink: 'https://github.com/example/chat',
    emoji: '💬',
  },
  {
    id: 6,
    name: 'Fitness Tracker',
    description: 'Mobile‑first fitness app with workout plans and progress charts.',
    techStack: ['React Native', 'GraphQL', 'Firebase', 'Recharts'],
    demoLink: 'https://fitness.example.com',
    githubLink: 'https://github.com/example/fitness',
    emoji: '🏋️',
  },
];