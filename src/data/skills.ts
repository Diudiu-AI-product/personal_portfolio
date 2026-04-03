export interface Skill {
  id: number;
  name: string;
  category: 'frontend' | 'backend' | 'tool' | 'language' | 'ai';
}

export const skills: Skill[] = [
  { id: 1, name: 'RAG 架构设计', category: 'ai' },
  { id: 2, name: 'Agent 任务链', category: 'ai' },
  { id: 3, name: 'Prompt Engineering', category: 'ai' },
  { id: 4, name: 'Fine-tunning', category: 'ai' },
  { id: 5, name: 'Transformer', category: 'ai' },
  { id: 6, name: 'Ragas 自动化评测', category: 'ai' },
  { id: 7, name: 'Ollama', category: 'tool' },
  { id: 8, name: 'Docker', category: 'tool' },
  { id: 9, name: 'Google stitch', category: 'tool' },
  { id: 10, name: 'Claude code / Cursor', category: 'tool' },
  { id: 11, name: 'Figma', category: 'tool' },
  { id: 12, name: 'Github', category: 'tool' },
];