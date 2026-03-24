export interface Section {
  id: number;
  title: string;
  emoji: string;
  color: string;
  totalQuestions: number;
  completed: number;
}

export const sections: Section[] = [
  {
    id: 1,
    title: 'What is the UK',
    emoji: '🌍',
    color: '#FF9600',
    totalQuestions: 20,
    completed: 0,
  },
  {
    id: 2,
    title: 'Values & Principles',
    emoji: '🏛️',
    color: '#FF4B4B',
    totalQuestions: 20,
    completed: 0,
  },
  {
    id: 3,
    title: 'History of the UK',
    emoji: '📜',
    color: '#1CB0F6',
    totalQuestions: 30,
    completed: 0,
  },
  {
    id: 4,
    title: 'Modern Society',
    emoji: '🏙️',
    color: '#1A56DB',
    totalQuestions: 25,
    completed: 0,
  },
  {
    id: 5,
    title: 'Government & Law',
    emoji: '⚖️',
    color: '#CE82FF',
    totalQuestions: 20,
    completed: 0,
  },
];
