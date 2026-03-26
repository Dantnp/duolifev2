export interface Section {
  id: number;
  title: string;
  icon: string;
  color: string;
  totalQuestions: number;
  completed: number;
}

export const sections: Section[] = [
  {
    id: 1,
    title: 'What is the UK',
    icon: 'globe-outline',
    color: '#FF9600',
    totalQuestions: 9,
    completed: 0,
  },
  {
    id: 2,
    title: 'Values & Principles',
    icon: 'business-outline',
    color: '#FF4B4B',
    totalQuestions: 9,
    completed: 0,
  },
  {
    id: 3,
    title: 'History of the UK',
    icon: 'time-outline',
    color: '#1CB0F6',
    totalQuestions: 9,
    completed: 0,
  },
  {
    id: 4,
    title: 'Modern Society',
    icon: 'people-outline',
    color: '#1A56DB',
    totalQuestions: 9,
    completed: 0,
  },
  {
    id: 5,
    title: 'Government & Law',
    icon: 'shield-checkmark-outline',
    color: '#CE82FF',
    totalQuestions: 9,
    completed: 0,
  },
];
