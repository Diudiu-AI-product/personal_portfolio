export interface Skill {
  id: number;
  name: string;
  category: 'frontend' | 'backend' | 'tool' | 'language';
}

export const skills: Skill[] = [
  { id: 1, name: 'React', category: 'frontend' },
  { id: 2, name: 'TypeScript', category: 'frontend' },
  { id: 3, name: 'JavaScript', category: 'language' },
  { id: 4, name: 'Tailwind CSS', category: 'frontend' },
  { id: 5, name: 'Node.js', category: 'backend' },
  { id: 6, name: 'Express', category: 'backend' },
  { id: 7, name: 'MongoDB', category: 'backend' },
  { id: 8, name: 'PostgreSQL', category: 'backend' },
  { id: 9, name: 'Git', category: 'tool' },
  { id: 10, name: 'Docker', category: 'tool' },
  { id: 11, name: 'AWS', category: 'tool' },
  { id: 12, name: 'Python', category: 'language' },
];