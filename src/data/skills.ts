export interface Skill {
  id: number;
  name: string;
  category: 'frontend' | 'backend' | 'tool' | 'language' | 'ai';
}

export const skills: Skill[] = [
  { id: 1, name: 'RAG 架构设计', category: 'ai' },
  { id: 2, name: 'Agent 任务链', category: 'ai' },
  { id: 3, name: '提示词工程 (Prompt Engineering)', category: 'ai' },
  { id: 4, name: 'Function-calling', category: 'ai' },
  { id: 5, name: 'Transformer', category: 'ai' },
  { id: 6, name: 'Fine-tuning', category: 'ai' },
  { id: 7, name: 'Ragas 自动化评测', category: 'ai' },
  { id: 8, name: 'Ollama', category: 'tool' },
  { id: 9, name: 'Docker', category: 'tool' },
  { id: 10, name: 'Claude Code', category: 'tool' },
  { id: 11, name: 'Cursor', category: 'tool' },
  { id: 12, name: 'Google Sheets', category: 'tool' },
  { id: 13, name: 'GitHub', category: 'tool' },
];